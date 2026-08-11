// Enums para Cash
export const MOVEMENT_TYPE = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
}

export const MOVEMENT_CATEGORY = {
  VENDA: 'VENDA',
  SINAL: 'SINAL',
  DESPESA: 'DESPESA',
  SANGRIA: 'SANGRIA', // retirada de dinheiro do caixa
  REFORCO: 'REFORCO', // entrada de dinheiro extra no caixa
  OUTRO: 'OUTRO',
}

// DTO para abrir sessão de caixa
export const openCashSessionDTO = (data) => ({
  valorAbertura: parseFloat(data.valorAbertura) || 0,
  userAbertura: data.userAbertura, // userID
})

// DTO para fechar sessão de caixa
export const closeCashSessionDTO = (data) => ({
  valorFechamentoContado: parseFloat(data.valorFechamentoContado) || 0,
  userFechamento: data.userFechamento, // userID
})

// DTO para adicionar movimentação
export const createMovementDTO = (data) => ({
  tipo: data.tipo || MOVEMENT_TYPE.ENTRADA,
  categoria: data.categoria || MOVEMENT_CATEGORY.OUTRO,
  valor: parseFloat(data.valor) || 0,
  descricao: data.descricao || '',
  orderHistoryId: data.orderHistoryId || null,
  userId: data.userId, // userID
})

// DTO para resposta de sessão
export const cashSessionResponseDTO = (data) => ({
  id: data._id || data.id,
  valorAbertura: data.valorAbertura,
  status: data.status, // ABERTO ou FECHADO
  dataAbertura: data.createdAt,
  dataFechamento: data.dataFechamento,
  valorFechamentoContado: data.valorFechamentoContado,
  valorFechamentoEsperado: data.valorFechamentoEsperado,
  diferenca: data.diferenca,
  userAbertura: data.userAbertura,
  userFechamento: data.userFechamento,
})

// DTO para resposta de movimentação
export const movementResponseDTO = (data) => ({
  id: data._id || data.id,
  tipo: data.tipo,
  categoria: data.categoria,
  valor: data.valor,
  descricao: data.descricao,
  cashSessionId: data.cashSessionId,
  orderHistoryId: data.orderHistoryId,
  userId: data.userId,
  createdAt: data.createdAt,
})

// Validações
export const validateOpenSession = (data) => {
  const errors = {}
  if (data.valorAbertura === undefined || parseFloat(data.valorAbertura) < 0) {
    errors.valorAbertura = 'Valor de abertura válido é obrigatório'
  }
  if (!data.userAbertura) {
    errors.userAbertura = 'Usuário é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

export const validateCloseSession = (data) => {
  const errors = {}
  if (data.valorFechamentoContado === undefined || parseFloat(data.valorFechamentoContado) < 0) {
    errors.valorFechamentoContado = 'Valor de fechamento válido é obrigatório'
  }
  if (!data.userFechamento) {
    errors.userFechamento = 'Usuário é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

export const validateMovement = (data) => {
  const errors = {}
  if (!data.tipo || !Object.values(MOVEMENT_TYPE).includes(data.tipo)) {
    errors.tipo = 'Tipo válido é obrigatório'
  }
  if (!data.categoria || !Object.values(MOVEMENT_CATEGORY).includes(data.categoria)) {
    errors.categoria = 'Categoria válida é obrigatória'
  }
  if (data.valor === undefined || parseFloat(data.valor) <= 0) {
    errors.valor = 'Valor deve ser maior que zero'
  }
  if (!data.userId) {
    errors.userId = 'Usuário é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
