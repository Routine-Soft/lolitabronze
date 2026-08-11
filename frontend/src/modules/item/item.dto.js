// Enums para Item
export const ITEM_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
}

// DTO para criar item
export const createItemDTO = (data) => ({
  name: data.name || '',
  description: data.description || '',
  type: data.type || ITEM_TYPE.PRODUCT,
  price: parseFloat(data.price) || 0,
  quantity: data.type === ITEM_TYPE.PRODUCT ? (parseInt(data.quantity) || 0) : null,
  discount: {
    diasSemana: data.discount?.diasSemana || [],
    percentual: parseFloat(data.discount?.percentual) || 0,
  },
})

// DTO para atualizar item
export const updateItemDTO = (data) => ({
  name: data.name,
  description: data.description,
  type: data.type,
  price: parseFloat(data.price),
  quantity: data.type === ITEM_TYPE.PRODUCT ? parseInt(data.quantity) : null,
  discount: {
    diasSemana: data.discount?.diasSemana || [],
    percentual: parseFloat(data.discount?.percentual) || 0,
  },
})

// DTO para resposta de item
export const itemResponseDTO = (data) => ({
  id: data._id || data.id,
  name: data.name,
  description: data.description,
  type: data.type,
  price: data.price,
  quantity: data.quantity,
  discount: data.discount,
  createdAt: data.createdAt,
})

// Validações
export const validateItem = (data) => {
  const errors = {}
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nome é obrigatório'
  }
  if (!data.type || !Object.values(ITEM_TYPE).includes(data.type)) {
    errors.type = 'Tipo válido é obrigatório'
  }
  if (data.price === undefined || data.price === null || parseFloat(data.price) < 0) {
    errors.price = 'Preço válido é obrigatório'
  }
  if (data.type === ITEM_TYPE.PRODUCT && (!data.quantity || parseInt(data.quantity) < 0)) {
    errors.quantity = 'Quantidade é obrigatória para produtos'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
