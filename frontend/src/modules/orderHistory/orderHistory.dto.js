// DTO para criar pedido
export const createOrderDTO = (data) => ({
  customerId: data.customerId,
  items: (data.items || []).map(item => ({
    itemId: item.itemId,
    quantidade: parseInt(item.quantidade) || 1,
  })),
  observacao: data.observacao || '',
  sinal: data.sinal === true, // OBRIGATÓRIO ser true
  userId: data.userId,
})

// DTO para resposta de pedido
export const orderResponseDTO = (data) => ({
  id: data._id || data.id,
  customerId: data.customerId,
  customer: data.customerId?.name || 'Desconhecido',
  items: (data.items || []).map(item => ({
    itemId: item.itemId?._id || item.itemId,
    itemName: item.itemId?.name || '',
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    subtotal: item.precoUnitario * item.quantidade,
  })),
  observacao: data.observacao,
  total: data.total,
  sinal: data.sinal,
  userId: data.userId,
  userName: data.userId?.name || 'Desconhecido',
  createdAt: data.createdAt,
})

// DTO para item do pedido
export const orderItemDTO = (data) => ({
  itemId: data.itemId,
  quantidade: parseInt(data.quantidade) || 1,
})

// Validações
export const validateOrder = (data) => {
  const errors = {}
  if (!data.customerId) {
    errors.customerId = 'Cliente é obrigatório'
  }
  if (!data.items || data.items.length === 0) {
    errors.items = 'Pelo menos um item é obrigatório'
  }
  if (data.sinal !== true) {
    errors.sinal = 'Sinal (pagamento inicial) é obrigatório'
  }
  if (!data.userId) {
    errors.userId = 'Usuário é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
