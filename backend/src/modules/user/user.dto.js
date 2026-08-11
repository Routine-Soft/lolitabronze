import { ROLES } from '../shared/enums/roles.enum.js'

// DTO (Data Transfer Object) for creating a user
export function createUserDTO(body) {
    return {
        name: body.name,
        email: body.email,
        password: body.password,
        roles: body.roles || [ROLES.RECEPCIONISTA], // Default role is 'recepcionista' if not provided
    }
}

// DTO for updating a user - except for the password, which should be handled separately
export function updateUserDTO(body) {
    const allowed = [
        'name',
        'email',
    ]
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )
}

export function toUserResponseDto(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    createdAt: user.createdAt,
  };
}

// DTO for user login
export function loginUserDTO(body) {
    return {
        email: body.email,
        password: body.password,
    }
}