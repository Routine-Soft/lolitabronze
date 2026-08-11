// DTO para criar um novo usuário
export const createUserDTO = (data) => ({
  name: data.name || '',
  email: data.email || '',
  password: data.password || '',
  roles: data.roles || ['recepcionista'],
})

// DTO para login
export const loginUserDTO = (data) => ({
  email: data.email || '',
  password: data.password || '',
})

// DTO para atualizar usuário
export const updateUserDTO = (data) => ({
  name: data.name,
  email: data.email,
})

// DTO para atualizar senha
export const updatePasswordDTO = (data) => ({
  currentPassword: data.currentPassword || '',
  newPassword: data.newPassword || '',
})

// DTO para resposta de usuário
export const userResponseDTO = (data) => ({
  id: data._id || data.id,
  name: data.name,
  email: data.email,
  roles: data.roles || [],
  createdAt: data.createdAt,
})

// Validações simples
export const validateCreateUser = (data) => {
  const errors = {}
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nome é obrigatório'
  }
  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Email válido é obrigatório'
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

export const validateLogin = (data) => {
  const errors = {}
  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Email válido é obrigatório'
  }
  if (!data.password || data.password.length === 0) {
    errors.password = 'Senha é obrigatória'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
