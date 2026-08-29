// modules/order/order.service.js
import { OrderModel, SINAL_VALOR } from './order.model.js';
import { ServicoModel } from '../servico/servico.model.js';
import { ProdutoModel } from '../produto/produto.model.js';
import * as cashService from '../cash/cash.service.js';
import CustomerModel from '../customer/customer.model.js';

// ====== VALIDAÇÕES ======

function validateAgenda(agendaDate) {
  const date = new Date(agendaDate);

  if (isNaN(date.getTime())) {
    const erro = new Error('Data de agendamento inválida');
    erro.statusCode = 400;
    throw erro;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (hours < 9 || hours > 18 || (hours === 18 && minutes > 30)) {
    const erro = new Error('Horário deve estar entre 09:00 e 18:30');
    erro.statusCode = 400;
    throw erro;
  }

  if (minutes !== 0 && minutes !== 30) {
    const erro = new Error('Agendamento deve estar em slots de 30 minutos (9:00, 9:30, 10:00, etc)');
    erro.statusCode = 400;
    throw erro;
  }
}

function validateTypePayment(typePayment) {
  const validTypes = ['pix', 'dinheiro', 'cartao'];
  if (!validTypes.includes(typePayment)) {
    const erro = new Error(`Tipo de pagamento deve ser um de: ${validTypes.join(', ')}`);
    erro.statusCode = 400;
    throw erro;
  }
}

async function getOrdersCountInSlot(agendaDate) {
  const slotStart = new Date(agendaDate);
  slotStart.setSeconds(0);
  slotStart.setMilliseconds(0);

  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30);

  return OrderModel.countDocuments({
    tipo: 'SERVICO',
    agenda: { $gte: slotStart, $lt: slotEnd },
    status: { $ne: 'CANCELADO' },
  });
}

async function generateNumeroAtendimento() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const count = await OrderModel.countDocuments({
    tipo: 'SERVICO',
    createdAt: { $gte: hoje, $lt: amanha },
  });

  return String(count + 1).padStart(4, '0');
}

// ====== FUNÇÕES PRINCIPAIS ======

export async function createOrder(dto) {
  if (!dto.customerId) {
    const erro = new Error('Selecione um cliente antes de criar o pedido');
    erro.statusCode = 400;
    throw erro;
  }
  
  validateTypePayment(dto.typePayment);

  if (dto.tipo === 'PRODUTO') {
    return createProdutoOrder(dto);
  }

  if (dto.tipo === 'SERVICO') {
    return createServicoOrder(dto);
  }

  const erro = new Error('Campo "tipo" deve ser PRODUTO ou SERVICO');
  erro.statusCode = 400;
  throw erro;
}

async function createProdutoOrder(dto) {
  if (!dto.produtos || dto.produtos.length === 0) {
    const erro = new Error('Adicione ao menos um produto ao pedido');
    erro.statusCode = 400;
    throw erro;
  }

  const produtoIds = dto.produtos.map((p) => p.produtoId);
  const produtosDb = await ProdutoModel.find({ _id: { $in: produtoIds } });

  const hoje = new Date().getDay();

  // 1. valida estoque ANTES de mexer em qualquer coisa
  for (const linha of dto.produtos) {
    const p = produtosDb.find((x) => x._id.toString() === linha.produtoId);
    if (!p) throw new Error(`Produto ${linha.produtoId} não encontrado`);

    const quantidadePedida = linha.quantidade || 1;

    // quantity === null significa "estoque não controlado" — não valida esse produto
    if (p.quantity !== null && p.quantity < quantidadePedida) {
      const erro = new Error(
        `Estoque insuficiente para "${p.name}". Disponível: ${p.quantity}, solicitado: ${quantidadePedida}.`
      );
      erro.statusCode = 400;
      throw erro;
    }
  }

  const produtosComPreco = dto.produtos.map((linha) => {
    const p = produtosDb.find((x) => x._id.toString() === linha.produtoId);
    const emPromocao = p.diasPromocionais.includes(hoje);
    const precoUnitario = emPromocao ? p.pricePromotional : p.priceNormal;

    return {
      produtoId: p._id,
      quantidade: linha.quantidade || 1,
      precoUnitario,
    };
  });

  const total = produtosComPreco.reduce(
    (soma, p) => soma + p.precoUnitario * p.quantidade,
    0
  );

  const order = await OrderModel.create({
    customerId: dto.customerId,
    userId: dto.userId,
    tipo: 'PRODUTO',
    produtos: produtosComPreco,
    total,
    valorPago: total,
    typePayment: dto.typePayment,
    observacao: dto.observacao,
    status: 'FINALIZADO',
    dataFinalizacao: new Date(),
    faturado: true,
    dataFaturamento: new Date(),
    valorFaturado: total,
  });

  // 2. desconta o estoque de forma atômica (só produtos com controle de estoque)
  for (const linha of produtosComPreco) {
    await ProdutoModel.updateOne(
      { _id: linha.produtoId, quantity: { $ne: null } },
      { $inc: { quantity: -linha.quantidade } }
    );
  }

  await cashService.registrarVendaNoCaixa({
    orderId: order._id,
    categoria: 'VENDA',
    valor: total,
    descricao: 'Venda de produto',
    typePayment: dto.typePayment,
    userId: dto.userId,
  });

  return order;
}

async function createServicoOrder(dto) {
  const servico = await ServicoModel.findById(dto.servicoId);
  if (!servico) {
    const erro = new Error('Serviço não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  validateAgenda(dto.agenda);

  const ordersInSlot = await getOrdersCountInSlot(dto.agenda);
  if (ordersInSlot >= 10) {
    const erro = new Error('Este horário está lotado. Máximo 10 agendamentos por slot.');
    erro.statusCode = 400;
    throw erro;
  }

  const hoje = new Date();
  const emPromocao = servico.diasPromocionais.includes(hoje.getDay());
  const total = emPromocao ? servico.pricePromotional : servico.priceNormal;

  const valorPago = dto.sinalPago ? SINAL_VALOR : total;
  const numeroAtendimento = await generateNumeroAtendimento();

  const order = await OrderModel.create({
    customerId: dto.customerId,
    userId: dto.userId,
    tipo: 'SERVICO',
    servicoId: dto.servicoId,
    agenda: new Date(dto.agenda),
    numeroAtendimento,
    sinalPago: dto.sinalPago,
    total,
    valorPago,
    typePayment: dto.typePayment,
    observacao: dto.observacao,
    status: 'AGENDADO',
    faturado: !dto.sinalPago,                          // <- novo: só true se pagou tudo
    dataFaturamento: !dto.sinalPago ? new Date() : null, // <- novo
    valorFaturado: !dto.sinalPago ? total : 0,           // <- novo
  });

  await cashService.registrarVendaNoCaixa({
    orderId: order._id,
    categoria: dto.sinalPago ? 'SINAL' : 'VENDA',
    valor: valorPago,
    descricao: `${dto.sinalPago ? 'Sinal' : 'Pagamento'} do serviço #${numeroAtendimento}`,
    typePayment: dto.typePayment,
    userId: dto.userId,
  });

  return order;
}

export async function listOrders(filtros = {}) {
  return OrderModel.find(filtros)
    .populate('customerId')
    .populate('userId')
    .populate('servicoId')
    .populate('produtos.produtoId')
    .sort({ createdAt: -1 });
}

export async function getOrderById(id) {
  return OrderModel.findById(id)
    .populate('customerId')
    .populate('userId')
    .populate('servicoId')
    .populate('produtos.produtoId');
}

export async function getSlotAvailability(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);

  const slots = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) break;

      const slotStart = new Date(year, month - 1, day, h, m, 0, 0);
      const slotEnd = new Date(year, month - 1, day, h, m + 30, 0, 0);

      const count = await OrderModel.countDocuments({
        tipo: 'SERVICO',
        agenda: { $gte: slotStart, $lt: slotEnd },
        status: { $ne: 'CANCELADO' },
      });

      slots.push({
        horario: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        vagasPreenchidas: count,
        vagasRestantes: Math.max(0, 10 - count),
        disponivel: count < 10,
      });
    }
  }

  return slots;
}

const TRANSICOES_PERMITIDAS = {
  AGENDADO: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

export async function updateOrderStatus(orderId, novoStatus) {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    const erro = new Error('Ordem não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  const permitido = TRANSICOES_PERMITIDAS[order.status] || [];
  if (!permitido.includes(novoStatus)) {
    const erro = new Error(`Não é possível mudar de ${order.status} para ${novoStatus}`);
    erro.statusCode = 400;
    throw erro;
  }

  order.status = novoStatus;
  if (novoStatus === 'FINALIZADO') {
    order.dataFinalizacao = new Date();
  }

  await order.save();
  return order;
}

export async function registrarPagamentoRestante(orderId, userId, typePayment) {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    const erro = new Error('Ordem não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  if (order.tipo !== 'SERVICO') {
    const erro = new Error('Apenas serviços têm pagamento parcial');
    erro.statusCode = 400;
    throw erro;
  }

  const valorRestante = order.total - order.valorPago;
  if (valorRestante <= 0) {
    const erro = new Error('Este pedido já está totalmente pago');
    erro.statusCode = 400;
    throw erro;
  }

  await cashService.registrarVendaNoCaixa({
    orderId: order._id,
    categoria: 'COMPLEMENTO',
    valor: valorRestante,
    descricao: `Complemento do serviço #${order.numeroAtendimento}`,
    typePayment,
    userId,
  });

  order.valorPago = order.total;

  // pagamento completou agora -> reconhece faturamento no dia de hoje
  order.faturado = true;
  order.dataFaturamento = new Date();
  order.valorFaturado = order.total;

  await order.save();

  return order;
}

export async function updateOrder(id, body) {
  const order = await OrderModel.findById(id);
  if (!order) {
    const erro = new Error('Ordem não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  if (order.tipo === 'PRODUTO') {
    return updateProdutoOrder(order, body);
  }

  return updateServicoOrder(order, body);
}

async function updateProdutoOrder(order, body) {
  if (body.produtos) {
    const produtoIds = body.produtos.map((p) => p.produtoId);
    const produtosDb = await ProdutoModel.find({ _id: { $in: produtoIds } });
    const hoje = new Date().getDay();

    order.produtos = body.produtos.map((linha) => {
      const p = produtosDb.find((x) => x._id.toString() === linha.produtoId);
      if (!p) throw new Error(`Produto ${linha.produtoId} não encontrado`);

      const emPromocao = p.diasPromocionais.includes(hoje);
      const precoUnitario = emPromocao ? p.pricePromotional : p.priceNormal;

      return { produtoId: p._id, quantidade: linha.quantidade || 1, precoUnitario };
    });

    order.total = order.produtos.reduce((soma, p) => soma + p.precoUnitario * p.quantidade, 0);
    order.valorPago = order.total; // produto sempre paga tudo
  }

  if (body.customerId) order.customerId = body.customerId;
  if (body.typePayment) order.typePayment = body.typePayment;
  if (body.observacao !== undefined) order.observacao = body.observacao;

  await order.save();
  return order;
}

async function updateServicoOrder(order, body) {
  if (body.agenda) {
    validateAgenda(body.agenda);
    order.agenda = new Date(body.agenda);
  }

  if (body.customerId) order.customerId = body.customerId;
  if (body.typePayment) order.typePayment = body.typePayment;
  if (body.observacao !== undefined) order.observacao = body.observacao;

  await order.save();
  return order;
}

export async function cancelOrder(orderId, userId, reembolso = 'NENHUM') {
  if (!['NENHUM', 'SINAL', 'TOTAL'].includes(reembolso)) {
    const erro = new Error('Tipo de reembolso inválido');
    erro.statusCode = 400;
    throw erro;
  }

  const order = await OrderModel.findById(orderId);

  if (!order) {
    const erro = new Error('Ordem não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  if (order.status !== 'AGENDADO') {
    const erro = new Error('Só é possível cancelar pedidos AGENDADOS');
    erro.statusCode = 400;
    throw erro;
  }

  const totalmentePago =
    order.valorRestante <= 0 ||
    order.valorPago >= order.total;

  if (totalmentePago) {
    if (reembolso === 'TOTAL') {
      await cashService.registrarVendaNoCaixa({
        orderId: order._id,
        categoria: 'REEMBOLSO',
        valor: -order.valorPago,
        descricao: `Reembolso total do serviço #${order.numeroAtendimento}`,
        typePayment: null,
        userId,
      });

      order.valorPago = 0;
      order.faturado = false;
      order.dataFaturamento = null;
      order.valorFaturado = 0;
    }
  } else {
    if (reembolso === 'SINAL') {
      await cashService.registrarVendaNoCaixa({
        orderId: order._id,
        categoria: 'REEMBOLSO',
        valor: -order.valorPago,
        descricao: `Reembolso do sinal do serviço #${order.numeroAtendimento}`,
        typePayment: null,
        userId,
      });

      order.valorPago = 0;
    } else {
      order.faturado = true;
      order.dataFaturamento = new Date();
      order.valorFaturado = order.valorPago;
    }
  }

  order.status = 'CANCELADO';

  await order.save();

  return order;
}

export async function deleteOrder(id) {
  return OrderModel.findByIdAndDelete(id);
}

export async function getRelatorioFaturamento(dataInicio, dataFim) {
  const filtro = { faturado: true };
  if (dataInicio || dataFim) {
    filtro.dataFaturamento = {};
    if (dataInicio) filtro.dataFaturamento.$gte = new Date(dataInicio);
    if (dataFim) filtro.dataFaturamento.$lt = new Date(dataFim);
  }

  const orders = await OrderModel.find(filtro);

  const totalFaturado = orders.reduce((s, o) => s + o.valorFaturado, 0);
  const totalProdutos = orders.filter((o) => o.tipo === 'PRODUTO').reduce((s, o) => s + o.valorFaturado, 0);
  const totalServicos = orders.filter((o) => o.tipo === 'SERVICO').reduce((s, o) => s + o.valorFaturado, 0);

  const porTypePayment = { pix: 0, dinheiro: 0, cartao: 0 };
  orders.forEach((o) => {
    porTypePayment[o.typePayment] = (porTypePayment[o.typePayment] ?? 0) + o.valorFaturado;
  });

  return {
    totalFaturado,
    totalProdutos,
    totalServicos,
    porTypePayment,
    quantidadePedidos: orders.length,
  };
}

export async function getRankingVendas(dataInicio, dataFim) {
  const filtroData = {};
  if (dataInicio || dataFim) {
    filtroData.createdAt = {};
    if (dataInicio) filtroData.createdAt.$gte = new Date(dataInicio);
    if (dataFim) filtroData.createdAt.$lt = new Date(dataFim);
  }

  // ranking de produtos — cada order de produto pode ter várias linhas, por isso o $unwind
  const rankingProdutosRaw = await OrderModel.aggregate([
    { $match: { tipo: 'PRODUTO', status: { $ne: 'CANCELADO' }, ...filtroData } },
    { $unwind: '$produtos' },
    {
      $group: {
        _id: '$produtos.produtoId',
        quantidade: { $sum: '$produtos.quantidade' },
        valor: { $sum: { $multiply: ['$produtos.quantidade', '$produtos.precoUnitario'] } },
      },
    },
    { $sort: { quantidade: -1 } },
  ]);

  const produtoIds = rankingProdutosRaw.map((r) => r._id);
  const produtosDb = await ProdutoModel.find({ _id: { $in: produtoIds } });

  const produtos = rankingProdutosRaw.map((r) => {
    const produto = produtosDb.find((p) => p._id.toString() === r._id.toString());
    return {
      id: r._id,
      name: produto?.name ?? 'Produto removido',
      quantidade: r.quantidade,
      valor: r.valor,
    };
  });

  // ranking de serviços — cada order de serviço é sempre 1 unidade
  const rankingServicosRaw = await OrderModel.aggregate([
    { $match: { tipo: 'SERVICO', status: { $ne: 'CANCELADO' }, ...filtroData } },
    {
      $group: {
        _id: '$servicoId',
        quantidade: { $sum: 1 },
        valor: { $sum: '$total' },
      },
    },
    { $sort: { quantidade: -1 } },
  ]);

  const servicoIds = rankingServicosRaw.map((r) => r._id);
  const servicosDb = await ServicoModel.find({ _id: { $in: servicoIds } });

  const servicos = rankingServicosRaw.map((r) => {
    const servico = servicosDb.find((s) => s._id.toString() === r._id.toString());
    return {
      id: r._id,
      name: servico?.name ?? 'Serviço removido',
      quantidade: r.quantidade,
      valor: r.valor,
    };
  });

  // ranking de clientes — conta pedidos e soma valor gasto, produto + serviço juntos
  const rankingClientesRaw = await OrderModel.aggregate([
    { $match: { status: { $ne: 'CANCELADO' }, ...filtroData } },
    {
      $group: {
        _id: '$customerId',
        quantidade: { $sum: 1 },
        valor: { $sum: '$total' },
      },
    },
    { $sort: { quantidade: -1 } },
    { $limit: 20 }, // top 20, evita lista infinita se a base crescer
  ]);

  const customerIds = rankingClientesRaw.map((r) => r._id);
  const customersDb = await CustomerModel.find({ _id: { $in: customerIds } });

  const clientes = rankingClientesRaw.map((r) => {
    const customer = customersDb.find((c) => c._id.toString() === r._id.toString());
    return {
      id: r._id,
      name: customer?.name ?? 'Cliente removido',
      phone: customer?.phone ?? '',
      quantidade: r.quantidade,
      valor: r.valor,
    };
  });

  return { produtos, servicos, clientes };
}

// ============================================================
// ====== COMANDA (novo modelo — usado a partir de agora) ======
// ============================================================

function assertComandaAberta(order) {
  if (!order) {
    const erro = new Error('Comanda não encontrada');
    erro.statusCode = 404;
    throw erro;
  }
  if (order.status !== 'ABERTA') {
    const erro = new Error('Esta comanda não está aberta');
    erro.statusCode = 400;
    throw erro;
  }
}

export async function abrirComanda(dto) {
  if (!dto.customerId) {
    const erro = new Error('Selecione um cliente antes de abrir a comanda');
    erro.statusCode = 400;
    throw erro;
  }
  return OrderModel.create({
    customerId: dto.customerId,
    userId: dto.userId,
    status: 'ABERTA',
    itens: [],
    observacao: dto.observacao ?? '',
  });
}

export async function getComandaById(id) {
  return OrderModel.findById(id)
    .populate('customerId')
    .populate('userId')
    .populate('itens.produtoId')
    .populate('itens.servicoId');
}

export async function listComandas(filtros = {}) {
  return OrderModel.find(filtros)
    .populate('customerId')
    .populate('userId')
    .populate('itens.produtoId')
    .populate('itens.servicoId')
    .sort({ createdAt: -1 });
}

export async function adicionarProduto(orderId, { produtoId, quantidade }) {
  const order = await OrderModel.findById(orderId);
  assertComandaAberta(order);

  const produto = await ProdutoModel.findById(produtoId);
  if (!produto) {
    const erro = new Error('Produto não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  const qtd = quantidade || 1;
  if (produto.quantity !== null && produto.quantity < qtd) {
    const erro = new Error(
      `Estoque insuficiente para "${produto.name}". Disponível: ${produto.quantity}.`
    );
    erro.statusCode = 400;
    throw erro;
  }

  const hoje = new Date().getDay();
  const emPromocao = produto.diasPromocionais.includes(hoje);
  const precoUnitario = emPromocao ? produto.pricePromotional : produto.priceNormal;

  order.itens.push({
    tipo: 'PRODUTO',
    produtoId: produto._id,
    quantidade: qtd,
    precoUnitario,
    valorPago: 0, // produto só paga no fechamento da comanda
  });

  await ProdutoModel.updateOne(
    { _id: produtoId, quantity: { $ne: null } },
    { $inc: { quantity: -qtd } }
  );

  await order.save();
  return order;
}

export async function adicionarServico(orderId, dto) {
  const order = await OrderModel.findById(orderId);
  assertComandaAberta(order);

  const servico = await ServicoModel.findById(dto.servicoId);
  if (!servico) {
    const erro = new Error('Serviço não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  validateTypePayment(dto.typePayment);

  const requerAgendamento = servico.requerAgendamento !== false; // default true se o campo ainda não existir

  if (requerAgendamento) {
    if (!dto.agenda) {
      const erro = new Error('Este serviço exige data de agendamento');
      erro.statusCode = 400;
      throw erro;
    }
    validateAgenda(dto.agenda);
    const ordersInSlot = await getComandaOrdersCountInSlot(dto.agenda);
    if (ordersInSlot >= 10) {
      const erro = new Error('Este horário está lotado. Máximo 10 agendamentos por slot.');
      erro.statusCode = 400;
      throw erro;
    }
  }

  const hoje = new Date();
  const emPromocao = servico.diasPromocionais.includes(hoje.getDay());
  const total = emPromocao ? servico.pricePromotional : servico.priceNormal;
  const valorPago = dto.sinalPago ? SINAL_VALOR : total;
  const numeroAtendimento = requerAgendamento ? await generateNumeroAtendimentoComanda() : null;

  order.itens.push({
    tipo: 'SERVICO',
    servicoId: servico._id,
    agenda: requerAgendamento ? new Date(dto.agenda) : null,
    numeroAtendimento,
    statusServico: requerAgendamento ? 'AGENDADO' : 'FINALIZADO',
    sinalPago: dto.sinalPago,
    precoUnitario: total,
    valorPago,
    typePayment: dto.typePayment,
    faturado: !dto.sinalPago,
    dataFaturamento: !dto.sinalPago ? new Date() : null,
    valorFaturado: !dto.sinalPago ? total : 0,
  });

  await order.save();

  await cashService.registrarVendaNoCaixa({
    orderId: order._id,
    categoria: dto.sinalPago ? 'SINAL' : 'VENDA',
    valor: valorPago,
    descricao: `${dto.sinalPago ? 'Sinal' : 'Pagamento'} do serviço "${servico.name}"`,
    typePayment: dto.typePayment,
    userId: dto.userId,
  });

  return order;
}

export async function removerItem(orderId, itemId) {
  const order = await OrderModel.findById(orderId);
  assertComandaAberta(order);

  const item = order.itens.id(itemId);
  if (!item) {
    const erro = new Error('Item não encontrado na comanda');
    erro.statusCode = 404;
    throw erro;
  }
  if (item.valorPago > 0) {
    const erro = new Error('Não é possível remover um item que já teve pagamento registrado');
    erro.statusCode = 400;
    throw erro;
  }

  if (item.tipo === 'PRODUTO') {
    await ProdutoModel.updateOne(
      { _id: item.produtoId, quantity: { $ne: null } },
      { $inc: { quantity: item.quantidade } }
    );
  }

  item.deleteOne();
  await order.save();
  return order;
}

function calcularPendenteComanda(order) {
  return order.itens.reduce((soma, item) => {
    const totalItem = item.tipo === 'PRODUTO' ? item.precoUnitario * item.quantidade : item.precoUnitario;
    return soma + (totalItem - item.valorPago);
  }, 0);
}

export async function fecharComanda(orderId, { typePayment, userId }) {
  const order = await OrderModel.findById(orderId);
  assertComandaAberta(order);

  if (order.itens.length === 0) {
    const erro = new Error('Comanda vazia — adicione ao menos um item antes de fechar');
    erro.statusCode = 400;
    throw erro;
  }

  validateTypePayment(typePayment);

  const valorPendente = calcularPendenteComanda(order);

  if (valorPendente > 0) {
    order.itens.forEach((item) => {
      const totalItem = item.tipo === 'PRODUTO' ? item.precoUnitario * item.quantidade : item.precoUnitario;
      const restanteItem = totalItem - item.valorPago;
      if (restanteItem > 0) {
        item.valorPago = totalItem;
        item.typePayment = typePayment;
        item.faturado = true;
        item.dataFaturamento = new Date();
        item.valorFaturado = totalItem;
        if (item.tipo === 'SERVICO' && item.statusServico === 'AGENDADO' && !item.agenda) {
          item.statusServico = 'FINALIZADO';
        }
      }
    });

    await cashService.registrarVendaNoCaixa({
      orderId: order._id,
      categoria: 'COMPLEMENTO',
      valor: valorPendente,
      descricao: 'Fechamento de comanda',
      typePayment,
      userId,
    });
  }

  order.status = 'FECHADA';
  order.dataFechamento = new Date();
  await order.save();

  return order;
}

export async function cancelarComanda(orderId) {
  const order = await OrderModel.findById(orderId);
  assertComandaAberta(order);

  for (const item of order.itens) {
    if (item.tipo === 'PRODUTO' && item.valorPago === 0) {
      await ProdutoModel.updateOne(
        { _id: item.produtoId, quantity: { $ne: null } },
        { $inc: { quantity: item.quantidade } }
      );
    }
  }

  order.status = 'CANCELADA';
  await order.save();
  return order;
}

async function getComandaOrdersCountInSlot(agendaDate) {
  const slotStart = new Date(agendaDate);
  slotStart.setSeconds(0);
  slotStart.setMilliseconds(0);
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30);

  return OrderModel.countDocuments({
    'itens.agenda': { $gte: slotStart, $lt: slotEnd },
    'itens.statusServico': { $ne: 'CANCELADO' },
  });
}

async function generateNumeroAtendimentoComanda() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const count = await OrderModel.countDocuments({
    createdAt: { $gte: hoje, $lt: amanha },
    'itens.tipo': 'SERVICO',
  });

  return String(count + 1).padStart(4, '0');
}

export async function getSlotAvailabilityComanda(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const slots = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) break;
      const slotStart = new Date(year, month - 1, day, h, m, 0, 0);
      const slotEnd = new Date(year, month - 1, day, h, m + 30, 0, 0);
      const count = await OrderModel.countDocuments({
        'itens.agenda': { $gte: slotStart, $lt: slotEnd },
        'itens.statusServico': { $ne: 'CANCELADO' },
      });
      slots.push({
        horario: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        vagasPreenchidas: count,
        vagasRestantes: Math.max(0, 10 - count),
        disponivel: count < 10,
      });
    }
  }
  return slots;
}