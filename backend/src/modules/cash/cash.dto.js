// modules/cash/cash.dto.js
export function toOpenSessionDto(body, userId) {
  return { valorAbertura: body.valorAbertura, userAbertura: userId };
}

export function toCloseSessionDto(body, userId) {
  return { valorFechamentoContado: body.valorFechamentoContado, userFechamento: userId };
}

export function toCreateMovementDto(body, userId) {
  return {
    tipo: body.tipo,           // 'ENTRADA' | 'SAIDA'
    categoria: body.categoria, // 'VENDA' | 'SINAL' | 'COMPLEMENTO' | 'DESPESA' | 'SANGRIA' | 'REFORCO' | 'OUTRO'
    valor: body.valor,
    descricao: body.descricao,
    typePayment: body.typePayment ?? null,
    orderId: body.orderId ?? null,
    userId,
  };
}

export function toDespesaDto(body, userId) {
  return {
    valor: body.valor,
    descricao: body.descricao,
    typePayment: body.typePayment ?? null,
    userId,
  };
}

export function toSessionResponseDto(session, resumo = null) {
  return {
    id: session._id,
    status: session.status,
    dataAbertura: session.dataAbertura,
    dataFechamento: session.dataFechamento,
    valorAbertura: session.valorAbertura,
    valorFechamentoContado: session.valorFechamentoContado,
    valorFechamentoEsperado: session.valorFechamentoEsperado,
    diferenca: session.diferenca,
    userAbertura: session.userAbertura,
    userFechamento: session.userFechamento,
    resumo, // { totalEntradas, totalSaidas, totalVendas, totalDespesas, lucro }
  };
}

export function toMovementResponseDto(movement) {
  return {
    id: movement._id,
    cashSessionId: movement.cashSessionId,
    tipo: movement.tipo,
    categoria: movement.categoria,
    valor: movement.valor,
    descricao: movement.descricao,
    typePayment: movement.typePayment,
    orderId: movement.orderId,
    userId: movement.userId,
    createdAt: movement.createdAt,
  };
}