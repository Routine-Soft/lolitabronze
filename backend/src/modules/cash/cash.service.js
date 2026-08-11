// modules/cash/cash.service.js
import { CashSessionModel } from './cashSession.model.js';
import { CashMovementModel } from './cashMovment.model.js';
import { MOVEMENT_TYPE, MOVEMENT_CATEGORY } from '../shared/enums/cashMovement.enum.js';

export async function openSession(dto) {
  const sessaoAberta = await CashSessionModel.findOne({ status: 'ABERTO' });
  if (sessaoAberta) {
    const erro = new Error('Já existe um caixa aberto.');
    erro.statusCode = 400;
    throw erro;
  }
  return CashSessionModel.create({ ...dto, status: 'ABERTO' });
}

export async function getOpenSession() {
  return CashSessionModel.findOne({ status: 'ABERTO' });
}

export async function createMovement(dto) {
  const sessao = await getOpenSession();
  if (!sessao) {
    const erro = new Error('Nenhum caixa aberto para lançar movimentação.');
    erro.statusCode = 400;
    throw erro;
  }
  return CashMovementModel.create({ ...dto, cashSessionId: sessao._id });
}

// chamado automaticamente pelo orderHistory.service quando um pedido é criado
export async function registrarVendaNoCaixa({ orderId, valor, userId }) {
  return createMovement({
    tipo: MOVEMENT_TYPE.ENTRADA,
    categoria: MOVEMENT_CATEGORY.VENDA,
    valor,
    descricao: `Venda referente ao pedido ${orderId}`,
    orderHistoryId: orderId,
    userId,
  });
}

async function calcularResumo(cashSessionId) {
  const movimentos = await CashMovementModel.find({ cashSessionId });

  const totalEntradas = movimentos
    .filter((m) => m.tipo === MOVEMENT_TYPE.ENTRADA)
    .reduce((soma, m) => soma + m.valor, 0);

  const totalSaidas = movimentos
    .filter((m) => m.tipo === MOVEMENT_TYPE.SAIDA)
    .reduce((soma, m) => soma + m.valor, 0);

  const totalDespesas = movimentos
    .filter((m) => m.tipo === MOVEMENT_TYPE.SAIDA && m.categoria === MOVEMENT_CATEGORY.DESPESA)
    .reduce((soma, m) => soma + m.valor, 0);

  const totalVendas = movimentos
    .filter((m) => m.tipo === MOVEMENT_TYPE.ENTRADA && m.categoria === MOVEMENT_CATEGORY.VENDA)
    .reduce((soma, m) => soma + m.valor, 0);

  return {
    totalEntradas,
    totalSaidas,
    lucro: totalVendas - totalDespesas,
  };
}

export async function closeSession(sessionId, dto) {
  const sessao = await CashSessionModel.findById(sessionId);
  if (!sessao || sessao.status !== 'ABERTO') {
    const erro = new Error('Sessão de caixa inválida ou já fechada.');
    erro.statusCode = 400;
    throw erro;
  }

  const resumo = await calcularResumo(sessionId);
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

export async function getSessionSummary(sessionId) {
  const sessao = await CashSessionModel.findById(sessionId);
  const resumo = await calcularResumo(sessionId);
  return { sessao, resumo };
}