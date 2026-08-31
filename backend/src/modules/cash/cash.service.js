// modules/cash/cash.service.js
import { CashSessionModel, CashMovementModel } from './cash.model.js';

// ====== SESSÕES (CAIXA) ======

export async function openSession(dto) {
  const sessaoAberta = await CashSessionModel.findOne({ status: 'ABERTO' });
  if (sessaoAberta) {
    const erro = new Error('Já existe um caixa aberto.');
    erro.statusCode = 400;
    throw erro;
  }
  return CashSessionModel.create(dto);
}

export async function getOpenSession() {
  return CashSessionModel.findOne({ status: 'ABERTO' });
}

export async function listSessions() {
  return CashSessionModel.find().sort({ createdAt: -1 });
}

export async function getSessionById(id) {
  return CashSessionModel.findById(id);
}

async function calcularResumo(cashSessionId) {
  const movimentos = await CashMovementModel.find({ cashSessionId });

  const totalEntradas = movimentos.filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movimentos.filter((m) => m.tipo === 'SAIDA').reduce((s, m) => s + m.valor, 0);
  const totalVendas = movimentos
    .filter((m) => ['VENDA', 'SINAL', 'COMPLEMENTO'].includes(m.categoria))
    .reduce((s, m) => s + m.valor, 0);
  const totalDespesas = movimentos.filter((m) => m.categoria === 'DESPESA').reduce((s, m) => s + m.valor, 0);

  return { totalEntradas, totalSaidas, totalVendas, totalDespesas, lucro: totalVendas - totalDespesas };
}

export async function getSessionSummary(id) {
  const sessao = await CashSessionModel.findById(id);
  const resumo = await calcularResumo(id);
  return { sessao, resumo };
}

export async function closeSession(id, dto) {
  const sessao = await CashSessionModel.findById(id);
  if (!sessao || sessao.status !== 'ABERTO') {
    const erro = new Error('Sessão de caixa inválida ou já fechada.');
    erro.statusCode = 400;
    throw erro;
  }

  const resumo = await calcularResumo(id);
  const valorFechamentoEsperado = sessao.valorAbertura + resumo.totalEntradas - resumo.totalSaidas;
  const diferenca = dto.valorFechamentoContado - valorFechamentoEsperado;

  sessao.status = 'FECHADO';
  sessao.dataFechamento = new Date();
  sessao.valorFechamentoContado = dto.valorFechamentoContado;
  sessao.valorFechamentoEsperado = valorFechamentoEsperado;
  sessao.diferenca = diferenca;
  sessao.userFechamento = dto.userFechamento;

  await sessao.save();
  return { sessao, resumo };
}

export async function deleteSession(id) {
  const temMovimentos = await CashMovementModel.exists({ cashSessionId: id });
  if (temMovimentos) {
    const erro = new Error('Não é possível excluir uma sessão com movimentações. Exclua as movimentações primeiro.');
    erro.statusCode = 400;
    throw erro;
  }
  return CashSessionModel.findByIdAndDelete(id);
}

// ====== MOVIMENTAÇÕES ======

export async function createMovement(dto) {
  const sessao = await getOpenSession();
  if (!sessao) {
    const erro = new Error('Nenhum caixa aberto para lançar movimentação.');
    erro.statusCode = 400;
    throw erro;
  }
  return CashMovementModel.create({ ...dto, cashSessionId: sessao._id });
}

export async function createDespesa(dto) {
  return createMovement({
    tipo: 'SAIDA',
    categoria: 'DESPESA',
    valor: dto.valor,
    descricao: dto.descricao,
    typePayment: dto.typePayment ?? null,
    userId: dto.userId,
  });
}

// chamado pelo order.service quando um pedido gera entrada de caixa (venda/sinal/complemento)
export async function registrarVendaNoCaixa({ orderId, categoria, valor, descricao, typePayment, userId }) {
  const sessao = await getOpenSession();
  if (!sessao) return null; // sem caixa aberto, não lança — pedido segue existindo mesmo assim

  return CashMovementModel.create({
    cashSessionId: sessao._id,
    tipo: 'ENTRADA',
    categoria,
    valor,
    descricao,
    typePayment,
    orderId,
    userId,
  });
}

// chamado pelo order.service quando um item é removido com estorno (devolução ao cliente)
export async function registrarSaidaNoCaixa({ orderId, categoria, valor, descricao, typePayment, userId }) {
  const sessao = await getOpenSession();
  if (!sessao) return null; // sem caixa aberto, não lança — remoção segue existindo mesmo assim

  return CashMovementModel.create({
    cashSessionId: sessao._id,
    tipo: 'SAIDA',
    categoria,
    valor,
    descricao,
    typePayment,
    orderId,
    userId,
  });
}

export async function listMovements(filtros = {}) {
  return CashMovementModel.find(filtros)
    .populate('userId')
    .populate('orderId')
    .sort({ createdAt: -1 });
}

export async function getMovementById(id) {
  return CashMovementModel.findById(id).populate('userId').populate('orderId');
}

export async function updateMovement(id, dto) {
  return CashMovementModel.findByIdAndUpdate(id, dto, { new: true });
}

export async function deleteMovement(id) {
  return CashMovementModel.findByIdAndDelete(id);
}

export async function getRelatorioCaixa(dataInicio, dataFim) {
  const filtro = {};
  if (dataInicio || dataFim) {
    filtro.createdAt = {};
    if (dataInicio) filtro.createdAt.$gte = new Date(dataInicio);
    if (dataFim) filtro.createdAt.$lt = new Date(dataFim);
  }

  const movimentos = await CashMovementModel.find(filtro);

  const totalEntradas = movimentos.filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movimentos.filter((m) => m.tipo === 'SAIDA').reduce((s, m) => s + m.valor, 0);

  const porCategoria = {};
  movimentos.forEach((m) => {
    porCategoria[m.categoria] = (porCategoria[m.categoria] ?? 0) + m.valor;
  });

  // soma só as ENTRADAS por forma de pagamento (saídas normalmente não têm typePayment relevante pro relatório)
  const porTypePayment = { pix: 0, dinheiro: 0, cartao: 0 };
  movimentos
    .filter((m) => m.tipo === 'ENTRADA' && m.typePayment)
    .forEach((m) => {
      porTypePayment[m.typePayment] = (porTypePayment[m.typePayment] ?? 0) + m.valor;
    });

  return {
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
    porCategoria,
    porTypePayment,
    quantidadeMovimentos: movimentos.length,
  };
}

export async function getVendasPorTypePayment(dataInicio, dataFim) {
  const filtro = {
    tipo: 'ENTRADA',
    categoria: { $in: ['VENDA', 'SINAL', 'COMPLEMENTO'] },
  };
  if (dataInicio || dataFim) {
    filtro.createdAt = {};
    if (dataInicio) filtro.createdAt.$gte = new Date(dataInicio);
    if (dataFim) filtro.createdAt.$lt = new Date(dataFim);
  }

  const movimentos = await CashMovementModel.find(filtro);

  const porTypePayment = { pix: 0, dinheiro: 0, cartao: 0 };
  movimentos.forEach((m) => {
    if (m.typePayment) {
      porTypePayment[m.typePayment] = (porTypePayment[m.typePayment] ?? 0) + m.valor;
    }
  });

  return porTypePayment;
}