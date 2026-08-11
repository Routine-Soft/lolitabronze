// DTO para criar cliente
export const createCustomerDTO = (data) => ({
  name: data.name || '',
  phone: data.phone || '',
})

// DTO para atualizar cliente
export const updateCustomerDTO = (data) => ({
  name: data.name,
  phone: data.phone,
})

// DTO para resposta de cliente
export const customerResponseDTO = (data) => ({
  id: data._id || data.id,
  name: data.name,
  phone: data.phone,
  createdAt: data.createdAt,
})

// Validações
export const validateCustomer = (data) => {
  const errors = {}
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nome é obrigatório'
  }
  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = 'Telefone é obrigatório'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
