import { OrderModel, SINAL_VALOR } from './order.model.js';
import { ServicoModel } from '../servico/servico.model.js';
import { ProdutoModel } from '../produto/produto.model.js';
import CustomerModel from '../customer/customer.model.js';
import * as cashService from '../cash/cash.service.js';

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
    const erro = new Error('Agendamento deve estar em slots de 30 minutos');
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

async function getOrdersCountInSlot(agendaDate, ignoreItemId = null) {
  const slotStart = new Date(agendaDate);
  slotStart.setSeconds(0);
  slotStart.setMilliseconds(0);
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30);

  const filtro = {
    'itens.agenda': { $gte: slotStart, $lt: slotEnd },
    'itens.statusServico': { $ne: 'CANCELADO' },
  };
  if (ignoreItemId) filtro['itens._id'] = { $ne: ignoreItemId };

  return OrderModel.countDocuments(filtro);
}

async function generateNumeroAtendimento() {
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

function assertOrderAberta(order) {
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

// ====== CRUD BÁSICO DA COMANDA ======

export async function createOrder(dto) {
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

export async function listOrders(filtros = {}) {
  return OrderModel.find(filtros)
    .populate('customerId')
    .populate('userId')
    .populate('itens.produtoId')
    .populate('itens.servicoId')
    .sort({ createdAt: -1 });
}

export async function getOrderById(id) {
  return OrderModel.findById(id)
    .populate('customerId')
    .populate('userId')
    .populate('itens.produtoId')
    .populate('itens.servicoId');
}

export async function updateOrder(id, body) {
  const order = await OrderModel.findById(id);
  if (!order) {
    const erro = new Error('Comanda não encontrada');
    erro.statusCode = 404;
    throw erro;
  }
  if (body.customerId) order.customerId = body.customerId;
  if (body.observacao !== undefined) order.observacao = body.observacao;
  await order.save();
  return order;
}

export async function deleteOrder(id) {
  const order = await OrderModel.findById(id);
  if (!order) {
    const erro = new Error('Comanda não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  // devolve estoque de produtos ainda não pagos, mesma regra do cancelamento
  for (const item of order.itens) {
    if (item.tipo === 'PRODUTO' && item.valorPago === 0) {
      await ProdutoModel.updateOne(
        { _id: item.produtoId, quantity: { $ne: null } },
        { $inc: { quantity: item.quantidade } }
      );
    }
  }

  return OrderModel.findByIdAndDelete(id);
}

// ====== ITENS ======

export async function adicionarProduto(orderId, { produtoId, quantidade }) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

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
    valorPago: 0,
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
  assertOrderAberta(order);

  const servico = await ServicoModel.findById(dto.servicoId);
  if (!servico) {
    const erro = new Error('Serviço não encontrado');
    erro.statusCode = 404;
    throw erro;
  }

  const formasValidas = ['SINAL', 'TOTAL', 'NENHUM'];
  if (!formasValidas.includes(dto.formaPagamento)) {
    const erro = new Error(`formaPagamento deve ser um de: ${formasValidas.join(', ')}`);
    erro.statusCode = 400;
    throw erro;
  }

  // só exige typePayment se algum valor for pago agora
  if (dto.formaPagamento !== 'NENHUM') {
    validateTypePayment(dto.typePayment);
  }

  const requerAgendamento = servico.requerAgendamento !== false;

  if (requerAgendamento) {
    if (!dto.agenda) {
      const erro = new Error('Este serviço exige data de agendamento');
      erro.statusCode = 400;
      throw erro;
    }
    validateAgenda(dto.agenda);
    const ordersInSlot = await getOrdersCountInSlot(dto.agenda);
    if (ordersInSlot >= 10) {
      const erro = new Error('Este horário está lotado. Máximo 10 agendamentos por slot.');
      erro.statusCode = 400;
      throw erro;
    }
  }

  const hoje = new Date();
  const emPromocao = servico.diasPromocionais.includes(hoje.getDay());
  const total = emPromocao ? servico.pricePromotional : servico.priceNormal;

  let valorPago = 0;
  if (dto.formaPagamento === 'SINAL') valorPago = Math.min(SINAL_VALOR, total);
  else if (dto.formaPagamento === 'TOTAL') valorPago = total;
  // NENHUM => valorPago continua 0

  const numeroAtendimento = requerAgendamento ? await generateNumeroAtendimento() : null;
  const faturado = dto.formaPagamento === 'TOTAL';

  order.itens.push({
    tipo: 'SERVICO',
    servicoId: servico._id,
    agenda: requerAgendamento ? new Date(dto.agenda) : null,
    numeroAtendimento,
    statusServico: requerAgendamento ? 'AGENDADO' : 'FINALIZADO',
    sinalPago: dto.formaPagamento === 'SINAL',
    precoUnitario: total,
    valorPago,
    typePayment: dto.formaPagamento !== 'NENHUM' ? dto.typePayment : null,
    faturado,
    dataFaturamento: faturado ? new Date() : null,
    valorFaturado: faturado ? total : 0,
  });

  await order.save();

  if (valorPago > 0) {
    await cashService.registrarVendaNoCaixa({
      orderId: order._id,
      categoria: dto.formaPagamento === 'SINAL' ? 'SINAL' : 'VENDA',
      valor: valorPago,
      descricao: `${dto.formaPagamento === 'SINAL' ? 'Sinal' : 'Pagamento'} do serviço "${servico.name}"`,
      typePayment: dto.typePayment,
      userId: dto.userId,
    });
  }

  return order;
}

export async function updateItemProduto(orderId, itemId, { quantidade }) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

  const item = order.itens.id(itemId);
  if (!item || item.tipo !== 'PRODUTO') {
    const erro = new Error('Item de produto não encontrado');
    erro.statusCode = 404;
    throw erro;
  }
  if (item.valorPago > 0) {
    const erro = new Error('Não é possível editar um item que já teve pagamento registrado');
    erro.statusCode = 400;
    throw erro;
  }

  const produto = await ProdutoModel.findById(item.produtoId);
  const novaQtd = quantidade || 1;
  const diferenca = novaQtd - item.quantidade; // positivo = precisa reservar mais estoque

  if (produto && produto.quantity !== null && diferenca > 0 && produto.quantity < diferenca) {
    const erro = new Error(`Estoque insuficiente para "${produto.name}". Disponível: ${produto.quantity}.`);
    erro.statusCode = 400;
    throw erro;
  }

  if (produto && produto.quantity !== null) {
    await ProdutoModel.updateOne({ _id: produto._id }, { $inc: { quantity: -diferenca } });
  }

  item.quantidade = novaQtd;
  await order.save();
  return order;
}

export async function updateItemServico(orderId, itemId, { agenda }) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

  const item = order.itens.id(itemId);
  if (!item || item.tipo !== 'SERVICO') {
    const erro = new Error('Item de serviço não encontrado');
    erro.statusCode = 404;
    throw erro;
  }
  if (item.statusServico !== 'AGENDADO') {
    const erro = new Error('Só é possível reagendar itens com status AGENDADO');
    erro.statusCode = 400;
    throw erro;
  }
  if (!agenda) {
    const erro = new Error('Informe a nova data de agendamento');
    erro.statusCode = 400;
    throw erro;
  }

  validateAgenda(agenda);
  const ordersInSlot = await getOrdersCountInSlot(agenda, item._id);
  if (ordersInSlot >= 10) {
    const erro = new Error('Este horário está lotado. Máximo 10 agendamentos por slot.');
    erro.statusCode = 400;
    throw erro;
  }

  item.agenda = new Date(agenda);
  await order.save();
  return order;
}

export async function removerItem(orderId, itemId, { estorno, typePayment, userId } = {}) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

  const item = order.itens.id(itemId);
  if (!item) {
    const erro = new Error('Item não encontrado na comanda');
    erro.statusCode = 404;
    throw erro;
  }

  if (item.valorPago > 0) {
    const opcoesValidas = ['TOTAL', 'SINAL', 'NENHUM'];
    if (!opcoesValidas.includes(estorno)) {
      const erro = new Error(`Este item já tem pagamento registrado. Informe estorno: ${opcoesValidas.join(', ')}`);
      erro.statusCode = 400;
      throw erro;
    }

    let valorEstorno = 0;
    if (estorno === 'TOTAL') valorEstorno = item.valorPago;
    else if (estorno === 'SINAL') valorEstorno = Math.min(SINAL_VALOR, item.valorPago);
    // NENHUM => 0, dinheiro fica no caixa (ex: taxa de cancelamento)

    if (valorEstorno > 0) {
      // TODO: confirmar o nome/assinatura certos assim que eu ver cash.service.js
      await cashService.registrarSaidaNoCaixa({
        orderId: order._id,
        categoria: 'REEMBOLSO',
        valor: valorEstorno,
        descricao: `Estorno (${estorno.toLowerCase()}) — item removido da comanda`,
        typePayment: typePayment ?? item.typePayment,
        userId,
      });
    }
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

// ====== FECHAR / CANCELAR ======

function calcularPendente(order) {
  return order.itens.reduce((soma, item) => {
    const totalItem = item.tipo === 'PRODUTO' ? item.precoUnitario * item.quantidade : item.precoUnitario;
    return soma + (totalItem - item.valorPago);
  }, 0);
}

export async function fecharOrder(orderId, { pagamentos, userId }) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

  if (order.itens.length === 0) {
    const erro = new Error('Comanda vazia — adicione ao menos um item antes de fechar');
    erro.statusCode = 400;
    throw erro;
  }

  const valorPendente = calcularPendente(order);

  if (valorPendente > 0) {
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      const erro = new Error('Informe ao menos uma forma de pagamento');
      erro.statusCode = 400;
      throw erro;
    }

    pagamentos.forEach((p) => validateTypePayment(p.typePayment));

    const somaPagamentos = pagamentos.reduce((s, p) => s + Number(p.valor || 0), 0);
    if (Math.abs(somaPagamentos - valorPendente) > 0.01) {
      const erro = new Error(
        `A soma dos pagamentos (R$ ${somaPagamentos}) precisa ser igual ao valor pendente (R$ ${valorPendente})`
      );
      erro.statusCode = 400;
      throw erro;
    }

    // se foi pago com uma forma só, guarda ela no item; se foi dividido, fica null
    // (o detalhamento por forma de pagamento vive nos lançamentos de caixa, não no item)
    const typePaymentDoItem = pagamentos.length === 1 ? pagamentos[0].typePayment : null;

    order.itens.forEach((item) => {
      const totalItem = item.tipo === 'PRODUTO' ? item.precoUnitario * item.quantidade : item.precoUnitario;
      const restanteItem = totalItem - item.valorPago;
      if (restanteItem > 0) {
        item.valorPago = totalItem;
        item.typePayment = typePaymentDoItem;
        item.faturado = true;
        item.dataFaturamento = new Date();
        item.valorFaturado = totalItem;
        if (item.tipo === 'SERVICO' && item.statusServico === 'AGENDADO' && !item.agenda) {
          item.statusServico = 'FINALIZADO';
        }
      }
    });

    // lança uma movimentação de caixa por forma de pagamento informada
    for (const p of pagamentos) {
      if (p.valor > 0) {
        await cashService.registrarVendaNoCaixa({
          orderId: order._id,
          categoria: 'COMPLEMENTO',
          valor: p.valor,
          descricao: 'Fechamento de comanda',
          typePayment: p.typePayment,
          userId,
        });
      }
    }
  }

  order.status = 'FECHADA';
  order.dataFechamento = new Date();
  await order.save();

  return order;
}

export async function cancelarOrder(orderId) {
  const order = await OrderModel.findById(orderId);
  assertOrderAberta(order);

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

export async function getSlotAvailability(dateStr) {
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

// ====== RELATÓRIOS (reescritos para funcionar com itens[]) ======

export async function getRelatorioFaturamento(dataInicio, dataFim) {
  const match = { 'itens.faturado': true };
  if (dataInicio || dataFim) {
    match['itens.dataFaturamento'] = {};
    if (dataInicio) match['itens.dataFaturamento'].$gte = new Date(dataInicio);
    if (dataFim) match['itens.dataFaturamento'].$lt = new Date(dataFim);
  }

  const resultado = await OrderModel.aggregate([
    { $unwind: '$itens' },
    { $match: match },
    {
      $group: {
        _id: null,
        totalFaturado: { $sum: '$itens.valorFaturado' },
        totalProdutos: { $sum: { $cond: [{ $eq: ['$itens.tipo', 'PRODUTO'] }, '$itens.valorFaturado', 0] } },
        totalServicos: { $sum: { $cond: [{ $eq: ['$itens.tipo', 'SERVICO'] }, '$itens.valorFaturado', 0] } },
        quantidadeItens: { $sum: 1 },
        ordersEnvolvidas: { $addToSet: '$_id' },
      },
    },
  ]);

  const r = resultado[0] ?? {
    totalFaturado: 0, totalProdutos: 0, totalServicos: 0, quantidadeItens: 0, ordersEnvolvidas: [],
  };

  return {
    totalFaturado: r.totalFaturado,
    totalProdutos: r.totalProdutos,
    totalServicos: r.totalServicos,
    quantidadeItens: r.quantidadeItens,
    quantidadePedidos: r.ordersEnvolvidas.length,
  };
}

export async function getRankingVendas(dataInicio, dataFim) {
  const filtroData = {};
  if (dataInicio || dataFim) {
    filtroData.createdAt = {};
    if (dataInicio) filtroData.createdAt.$gte = new Date(dataInicio);
    if (dataFim) filtroData.createdAt.$lt = new Date(dataFim);
  }

  const rankingProdutosRaw = await OrderModel.aggregate([
    { $match: { status: { $ne: 'CANCELADA' }, ...filtroData } },
    { $unwind: '$itens' },
    { $match: { 'itens.tipo': 'PRODUTO' } },
    {
      $group: {
        _id: '$itens.produtoId',
        quantidade: { $sum: '$itens.quantidade' },
        valor: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } },
      },
    },
    { $sort: { quantidade: -1 } },
  ]);

  const produtoIds = rankingProdutosRaw.map((r) => r._id);
  const produtosDb = await ProdutoModel.find({ _id: { $in: produtoIds } });
  const produtos = rankingProdutosRaw.map((r) => {
    const produto = produtosDb.find((p) => p._id.toString() === r._id.toString());
    return { id: r._id, name: produto?.name ?? 'Produto removido', quantidade: r.quantidade, valor: r.valor };
  });

  const rankingServicosRaw = await OrderModel.aggregate([
    { $match: { status: { $ne: 'CANCELADA' }, ...filtroData } },
    { $unwind: '$itens' },
    { $match: { 'itens.tipo': 'SERVICO', 'itens.statusServico': { $ne: 'CANCELADO' } } },
    {
      $group: {
        _id: '$itens.servicoId',
        quantidade: { $sum: 1 },
        valor: { $sum: '$itens.precoUnitario' },
      },
    },
    { $sort: { quantidade: -1 } },
  ]);

  const servicoIds = rankingServicosRaw.map((r) => r._id);
  const servicosDb = await ServicoModel.find({ _id: { $in: servicoIds } });
  const servicos = rankingServicosRaw.map((r) => {
    const servico = servicosDb.find((s) => s._id.toString() === r._id.toString());
    return { id: r._id, name: servico?.name ?? 'Serviço removido', quantidade: r.quantidade, valor: r.valor };
  });

  const rankingClientesRaw = await OrderModel.aggregate([
    { $match: { status: { $ne: 'CANCELADA' }, ...filtroData } },
    { $unwind: '$itens' },
    {
      $addFields: {
        itemTotal: {
          $cond: [
            { $eq: ['$itens.tipo', 'PRODUTO'] },
            { $multiply: ['$itens.precoUnitario', '$itens.quantidade'] },
            '$itens.precoUnitario',
          ],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        customerId: { $first: '$customerId' },
        orderTotal: { $sum: '$itemTotal' },
      },
    },
    {
      $group: {
        _id: '$customerId',
        quantidade: { $sum: 1 },
        valor: { $sum: '$orderTotal' },
      },
    },
    { $sort: { quantidade: -1 } },
    { $limit: 20 },
  ]);

  const customerIds = rankingClientesRaw.map((r) => r._id);
  const customersDb = await CustomerModel.find({ _id: { $in: customerIds } });
  const clientes = rankingClientesRaw.map((r) => {
    const customer = customersDb.find((c) => c._id.toString() === r._id.toString());
    return { id: r._id, name: customer?.name ?? 'Cliente removido', phone: customer?.phone ?? '', quantidade: r.quantidade, valor: r.valor };
  });

  return { produtos, servicos, clientes };
}