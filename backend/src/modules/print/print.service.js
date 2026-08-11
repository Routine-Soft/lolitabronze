// modules/print/print.service.js
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { getOrderById } from '../orderHistory/orderHistory.service.js';

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON, // ESC/POS - compatível com Elgin i9 Full
  interface: 'usb', // ou 'tcp://IP:PORTA' se for rede
  width: 42,
});

export async function printOrder(orderId) {
  const order = await getOrderById(orderId);
  if (!order) {
    const erro = new Error('Pedido não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    const erro = new Error('Impressora térmica não conectada');
    erro.statusCode = 503;
    throw erro;
  }

  printer.clear();

  // logo (opcional, se tiver a imagem em bitmap/png já preparada)
  // await printer.printImage('./assets/logo.png');

  printer.alignCenter();
  printer.bold(true);
  printer.println('LOLITA BRONZE');
  printer.bold(false);
  printer.println('--------------------------------');

  printer.alignLeft();
  printer.println(`Cliente: ${order.customerId.nome}`);
  printer.println(`Data: ${order.createdAt.toLocaleDateString('pt-BR')}  Hora: ${order.createdAt.toLocaleTimeString('pt-BR')}`);
  printer.println(`Atendido por: ${order.userId.nome}`);
  printer.println('--------------------------------');

  order.items.forEach((linha) => {
    const nome = linha.itemId.name;
    const subtotal = (linha.precoUnitario * linha.quantidade).toFixed(2);
    printer.println(`${linha.quantidade}x ${nome}`);
    printer.alignRight();
    printer.println(`R$ ${subtotal}`);
    printer.alignLeft();
  });

  printer.println('--------------------------------');
  printer.alignRight();
  printer.bold(true);
  printer.println(`TOTAL: R$ ${order.total.toFixed(2)}`);
  printer.bold(false);
  printer.alignLeft();

  if (order.observacao) {
    printer.println(`Obs: ${order.observacao}`);
  }

  printer.println(`Sinal pago: ${order.sinal ? 'Sim' : 'Não'}`);

  printer.cut();

  await printer.execute();

  return { message: 'Impresso com sucesso' };
}