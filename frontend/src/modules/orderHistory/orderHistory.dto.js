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
  typePayment: data.typePayment, // 'pix', 'dinheiro', 'cartao'
  agenda: data.agenda, // ISO Date string
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

  typePayment: data.typePayment,

  agenda: data.agenda,

  numeroAtendimento: data.numeroAtendimento,

  status: data.status,

  dataFinalizacao: data.dataFinalizacao,

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
  // Sinal e agenda são opcionais (apenas backend validará condicionalidade por tipo de item)
  if (!data.userId) {
    errors.userId = 'Usuário é obrigatório'
  }
  if (!data.typePayment) {
    errors.typePayment = 'Tipo de pagamento é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }

}