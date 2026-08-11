// modules/cash/cash.dto.js
export function toOpenSessionDto(body, userId) {
  return { valorAbertura: body.valorAbertura, userAbertura: userId };
}

export function toCloseSessionDto(body, userId) {
  return { valorFechamentoContado: body.valorFechamentoContado, userFechamento: userId };
}

export function toCreateMovementDto(body, userId) {
  return {
    tipo: body.tipo,
    categoria: body.categoria,
    valor: body.valor,
    descricao: body.descricao,
    orderHistoryId: body.orderHistoryId ?? null,
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
    resumo, // { totalEntradas, totalSaidas, lucro } quando solicitado
  };
}