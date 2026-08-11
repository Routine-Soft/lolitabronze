// DTO para imprimir recibo de pedido
export const printOrderDTO = (data) => ({
  orderId: data.orderId,
})

// Validações
export const validatePrintOrder = (data) => {
  const errors = {}
  if (!data.orderId) {
    errors.orderId = 'ID do pedido é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
