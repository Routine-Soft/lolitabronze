import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import os from 'os';
import { getOrderById } from '../order/order.service.js';
import { resolveWindowsPrinterName, sendRawBufferToWindowsPrinter } from './windowsPrinter.js';

const PRINTER_MODE = (process.env.PRINTER_MODE || 'usb').toLowerCase(); // 'usb' | 'windows'
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || 'usb';
const WINDOWS_PRINTER_NAME = process.env.PRINTER_NAME || null;

function createPrinter() {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON, // ESC/POS - compatível com Elgin i9 Full
    interface: PRINTER_INTERFACE,
    width: 42,
  });
}

function logStep(logs, mensagem, extra = {}) {
  const entry = { timestamp: new Date().toISOString(), mensagem, ...extra };
  logs.push(entry);
  console.log('[PRINT]', JSON.stringify(entry));
  return entry;
}

async function ensureUsbPrinterConnected(printer, logs) {
  logStep(logs, 'Verificando conexão com a impressora', {
    interface: PRINTER_INTERFACE,
    plataforma: os.platform(),
    arquitetura: os.arch(),
    versaoNode: process.version,
  });

  let isConnected;
  try {
    isConnected = await printer.isPrinterConnected();
  } catch (err) {
    logStep(logs, 'Erro ao consultar a impressora', { erro: err.message, stack: err.stack });
    const erro = new Error(`Falha ao consultar a impressora: ${err.message}`);
    erro.statusCode = 503;
    erro.logs = logs;
    throw erro;
  }

  logStep(logs, 'Resultado da verificação de conexão', { conectada: isConnected });

  if (!isConnected) {
    logStep(logs, 'Impressora não encontrada na interface configurada');
    const erro = new Error('Impressora térmica não conectada');
    erro.statusCode = 503;
    erro.logs = logs;
    throw erro;
  }
}

async function ensureWindowsPrinterReady(logs) {
  logStep(logs, 'Verificando impressora na fila do Windows', {
    printerName: WINDOWS_PRINTER_NAME ?? 'auto (procurando por "Elgin")',
    plataforma: os.platform(),
  });

  let resolvedName;
  try {
    resolvedName = await resolveWindowsPrinterName(WINDOWS_PRINTER_NAME);
  } catch (err) {
    logStep(logs, 'Erro ao localizar impressora no Windows', { erro: err.message });
    const erro = new Error(err.message);
    erro.statusCode = 503;
    erro.logs = logs;
    throw erro;
  }

  logStep(logs, 'Impressora encontrada na fila do Windows', { impressora: resolvedName });
  return resolvedName;
}

// Prepara a impressora conforme o modo configurado e retorna o nome resolvido (modo windows) ou null (modo usb).
async function ensurePrinterReady(printer, logs) {
  if (PRINTER_MODE === 'windows') {
    return ensureWindowsPrinterReady(logs);
  }
  await ensureUsbPrinterConnected(printer, logs);
  return null;
}

async function sendToPrinter(printer, logs, windowsPrinterName) {
  if (PRINTER_MODE === 'windows') {
    logStep(logs, 'Enviando dados para a fila de impressão do Windows', { impressora: windowsPrinterName });
    try {
      await sendRawBufferToWindowsPrinter(printer.getBuffer(), windowsPrinterName);
    } catch (err) {
      logStep(logs, 'Erro ao enviar dados para a fila do Windows', { erro: err.message });
      const erro = new Error(`Falha ao imprimir via fila do Windows: ${err.message}`);
      erro.statusCode = 503;
      erro.logs = logs;
      throw erro;
    }
    return;
  }
  await printer.execute();
}

export async function testPrinter(texto) {
  const logs = [];
  const printer = createPrinter();

  try {
    const windowsPrinterName = await ensurePrinterReady(printer, logs);

    logStep(logs, 'Montando conteúdo do teste de impressão');
    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println('TESTE DE IMPRESSÃO');
    printer.bold(false);
    printer.println('--------------------------------');
    printer.alignLeft();
    printer.println(texto || 'Impressora funcionando corretamente.');
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`);
    printer.cut();

    logStep(logs, 'Enviando comando de impressão');
    await sendToPrinter(printer, logs, windowsPrinterName);
    logStep(logs, 'Impressão enviada com sucesso');

    return { message: 'Teste impresso com sucesso', logs };
  } catch (err) {
    if (!err.logs) {
      logStep(logs, 'Erro inesperado durante a impressão de teste', { erro: err.message, stack: err.stack });
      err.logs = logs;
    }
    throw err;
  }
}

export async function printOrder(orderId) {
  const logs = [];
  const printer = createPrinter();

  try {
    logStep(logs, 'Buscando pedido no banco', { orderId });
    const order = await getOrderById(orderId);
    if (!order) {
      logStep(logs, 'Pedido não encontrado');
      const erro = new Error('Pedido não encontrado');
      erro.statusCode = 404;
      erro.logs = logs;
      throw erro;
    }

    const windowsPrinterName = await ensurePrinterReady(printer, logs);

    logStep(logs, 'Montando recibo do pedido');
    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println('LOLITA BRONZE');
    printer.bold(false);
    printer.println('--------------------------------');

    printer.alignLeft();
    printer.println(`Cliente: ${order.customerId?.name ?? '-'}`);
    printer.println(`Data: ${order.createdAt.toLocaleDateString('pt-BR')}  Hora: ${order.createdAt.toLocaleTimeString('pt-BR')}`);
    printer.println(`Atendido por: ${order.userId?.name ?? '-'}`);
    printer.println('--------------------------------');

    if (order.tipo === 'PRODUTO') {
      order.produtos.forEach((linha) => {
        const nome = linha.produtoId?.name ?? 'Produto';
        const subtotal = (linha.precoUnitario * linha.quantidade).toFixed(2);
        printer.println(`${linha.quantidade}x ${nome}`);
        printer.alignRight();
        printer.println(`R$ ${subtotal}`);
        printer.alignLeft();
      });
    } else {
      const nome = order.servicoId?.name ?? 'Serviço';
      printer.println(`1x ${nome}`);
      printer.alignRight();
      printer.println(`R$ ${order.total.toFixed(2)}`);
      printer.alignLeft();

      if (order.numeroAtendimento) printer.println(`Atendimento nº ${order.numeroAtendimento}`);
      if (order.agenda) printer.println(`Agendado para: ${new Date(order.agenda).toLocaleString('pt-BR')}`);
    }

    printer.println('--------------------------------');
    printer.alignRight();
    printer.bold(true);
    printer.println(`TOTAL: R$ ${order.total.toFixed(2)}`);
    printer.bold(false);
    printer.alignLeft();

    if (order.observacao) printer.println(`Obs: ${order.observacao}`);

    if (order.tipo === 'SERVICO') {
      const valorRestante = order.total - order.valorPago;
      printer.println(`Pago: R$ ${order.valorPago.toFixed(2)}`);
      if (valorRestante > 0) printer.println(`Restante: R$ ${valorRestante.toFixed(2)}`);
    }

    printer.cut();

    logStep(logs, 'Enviando comando de impressão');
    await sendToPrinter(printer, logs, windowsPrinterName);
    logStep(logs, 'Recibo impresso com sucesso');

    return { message: 'Impresso com sucesso', logs };
  } catch (err) {
    if (!err.logs) {
      logStep(logs, 'Erro inesperado durante a impressão do recibo', { erro: err.message, stack: err.stack });
      err.logs = logs;
    }
    throw err;
  }
}