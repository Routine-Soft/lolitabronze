// modules/print/print.service.js
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { getOrderById } from '../order/order.service.js';

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON, // ESC/POS - compatível com Elgin i9 Full
  interface: 'usb', // ou 'tcp://IP:PORTA' se for rede
  width: 42,
});

async function ensurePrinterConnected() {
  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    const erro = new Error('Impressora térmica não conectada');
    erro.statusCode = 503;
    throw erro;
  }
}

export async function testPrinter(texto) {
  await ensurePrinterConnected();

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

  await printer.execute();

  return { message: 'Teste impresso com sucesso' };
}

export async function printOrder(orderId) {
  const order = await getOrderById(orderId); // já vem populado (customerId, userId, servicoId, produtos.produtoId)
  if (!order) {
    const erro = new Error('Pedido não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  await ensurePrinterConnected();

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

    if (order.numeroAtendimento) {
      printer.println(`Atendimento nº ${order.numeroAtendimento}`);
    }
    if (order.agenda) {
      printer.println(`Agendado para: ${new Date(order.agenda).toLocaleString('pt-BR')}`);
    }
  }

  printer.println('--------------------------------');
  printer.alignRight();
  printer.bold(true);
  printer.println(`TOTAL: R$ ${order.total.toFixed(2)}`);
  printer.bold(false);
  printer.alignLeft();

  if (order.observacao) {
    printer.println(`Obs: ${order.observacao}`);
  }

  if (order.tipo === 'SERVICO') {
    const valorRestante = order.total - order.valorPago;
    printer.println(`Pago: R$ ${order.valorPago.toFixed(2)}`);
    if (valorRestante > 0) {
      printer.println(`Restante: R$ ${valorRestante.toFixed(2)}`);
    }
  }

  printer.cut();

  await printer.execute();

  return { message: 'Impresso com sucesso' };
}