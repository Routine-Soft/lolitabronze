import { UserService } from './user.service.js'

export const UserController = {
    async getAllUsers(req, reply) {
        const users = await UserService.findAll()
        return reply.send({ data: users })
    },

    async getUserById(req, reply) {
        const { id } = req.params
        const user = await UserService.findById(id)
        return reply.send({ data: user })
    },

    async createUser(req, reply) {
        const user = await UserService.createUser(req.body)
        return reply.code(201).send({ data: user, message: 'Usuário criado com sucesso' })
    },

    async updateUser(req, reply) {
        const { id } = req.params
        const user = await UserService.updateUser(id, req.body)
        return reply.send({ data: user, message: 'Usuário atualizado com sucesso' })
    },

    async deleteUser(req, reply) {
        const { id } = req.params
        await UserService.deleteUser(id)
        return reply.send({ data: null, message: 'Usuário removido com sucesso' })
    },
    
    async loginUser(req, reply) {
        const result = await UserService.loginUser(req.body)
        return reply.send({ data: result, message: 'Login realizado com sucesso' })
    },

    async logoutUser(req, reply) {
        await UserService.logoutUser(req.user.id)
        return reply.send({ data: null, message: 'Logout realizado com sucesso' })
    },

    async refreshToken(req, reply) {
        const { refreshToken } = req.body
        const result = await UserService.refresh(refreshToken)
        return reply.send({ data: result, message: 'Token renovado com sucesso' })
    },

    async updatePassword(req, reply) {
        const { id } = req.params
        await UserService.updatePassword(id, req.body);
        return reply.send({ data: null, message: 'Senha atualizada com sucesso' })
    },
}