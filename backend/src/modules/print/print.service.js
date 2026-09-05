import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import os from 'os';
import { getOrderById } from '../order/order.service.js';
import { formasPagamentoDosItens } from '../order/order.dto.js';
import * as cashService from '../cash/cash.service.js';
import { resolveWindowsPrinterName, sendRawBufferToWindowsPrinter } from './windowsPrinter.js';
import { getLogoEscPosBuffer } from './logo.js';

const PRINTER_MODE = (process.env.PRINTER_MODE || 'usb').toLowerCase(); // 'usb' | 'windows'
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || 'usb';
const WINDOWS_PRINTER_NAME = process.env.PRINTER_NAME || null;
const LABEL_PAGAMENTO = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão', nao_informado: 'Não informado' };

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

// insere o logo no buffer; se falhar (ex.: falta de dependência nativa), segue sem ele
async function printLogo(printer, logs) {
  try {
    const logoBuffer = await getLogoEscPosBuffer();
    printer.add(logoBuffer);
    printer.newLine();
  } catch (err) {
    logStep(logs, 'Não foi possível montar o logo, seguindo sem ele', { erro: err.message });
  }
}

export async function testPrinter(texto) {
  const logs = [];
  const printer = createPrinter();

  try {
    const windowsPrinterName = await ensurePrinterReady(printer, logs);

    logStep(logs, 'Montando conteúdo do teste de impressão');
    printer.clear();
    printer.alignCenter();
    await printLogo(printer, logs);
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
    await printLogo(printer, logs);
    printer.bold(true);
    printer.println('LOLITA BRONZE');
    printer.bold(false);
    printer.println('--------------------------------');

    printer.alignLeft();
    printer.println(`COMANDA ${order.status}`);
    printer.println(`Cliente: ${order.customerId?.name ?? '-'}`);
    printer.println(`Telefone: ${order.customerId?.phone ?? '-'}`);
    printer.println(`Aberta em: ${order.createdAt.toLocaleDateString('pt-BR')}  Hora: ${order.createdAt.toLocaleTimeString('pt-BR')}`);
    if (order.status === 'FECHADA') printer.println(`Fechada em: ${order.dataFechamento.toLocaleDateString('pt-BR')}  Hora: ${order.dataFechamento.toLocaleTimeString('pt-BR')}`);
    printer.println('--------------------------------');
    printer.println(`Atendido por: ${order.userId?.name ?? '-'}`);
    printer.println('--------------------------------');

    const total = order.itens.reduce(
      (s, i) => s + (i.tipo === 'PRODUTO' ? i.precoUnitario * i.quantidade : i.precoUnitario),
      0
    );
    const totalPago = order.itens.reduce((s, i) => s + i.valorPago, 0);
    const totalPendente = total - totalPago;

    const formasPorOrder = await cashService.getFormasPagamentoPorOrders([order._id]);
    const formasPagamento = formasPorOrder[order._id.toString()]?.length > 0
      ? formasPorOrder[order._id.toString()]
      : formasPagamentoDosItens(order.itens);

    order.itens.forEach((item) => {
      if (item.tipo === 'PRODUTO') {
        const nome = item.produtoId?.name ?? 'Produto';
        const subtotal = (item.precoUnitario * item.quantidade).toFixed(2);
        printer.println(`${nome} ${item.quantidade} un x ${item.precoUnitario.toFixed(2)} total ${subtotal}`);
      } else {
        const nome = item.servicoId?.name ?? 'Serviço';
        printer.println(`${nome} total ${item.precoUnitario.toFixed(2)}`);

        printer.bold(true);
        if (item.numeroAtendimento) printer.println(`Serviço nº #${item.numeroAtendimento}`);
        if (item.agenda) printer.println(`Agendado para: ${new Date(item.agenda).toLocaleString('pt-BR')}`);
        printer.bold(false);;
      }

    });

    if (order.observacao) printer.println(`Obs: ${order.observacao}`);

    printer.println('--------------------------------');

    printer.alignRight();
    printer.bold(true);
    printer.println(`
    VALOR TOTAL: R$ ${total.toFixed(2)}`);
    printer.bold(false);
    printer.alignLeft();

    printer.alignRight();
    printer.bold(true);
    printer.println(`VALOR PAGO: R$ ${totalPago.toFixed(2)}`);
    printer.bold(false);
    printer.alignLeft();
    if (totalPendente > 0) printer.println(`Restante: R$ ${totalPendente.toFixed(2)}`);

    if (formasPagamento.length > 0) {
      const formasTexto = formasPagamento
        .map((f) => `${LABEL_PAGAMENTO[f.typePayment] ?? f.typePayment}: R$ ${f.valor.toFixed(2)}`)
        .join(' + ');
      printer.println(`Forma de pagamento:`)
      printer.println(`${formasTexto}`);
    }

    printer.newLine();
    printer.newLine();
    // impressora térmica não suporta emojis (fora da tabela ESC/POS), usando "*" no lugar
    printer.println(`Bronze em dia, autoestima em cima!`)
    printer.println(`Obrigado por escolher a Lolita Bronze!`);

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