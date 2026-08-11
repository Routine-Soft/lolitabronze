import { UserService } from './user.service.js'
import jwt from 'jsonwebtoken'

export const UserController = {
    async getAllUsers(req, reply) {
        const users = await UserService.findAll()
        return reply.send({ success: true, data: users, message: `Found ${users.length} users` })
    },

    async getUserById(req, reply) {
        const { id } = req.params
        const user = await UserService.findById(id)
        return reply.send({ success: true, data: user, message: 'User retrieved successfully' })
    },

    async createUser(req, reply) {
        const user = await UserService.createUser(req.body)
        return reply.code(201).send({ success: true, data: user, message: 'User created successfully' })
    },

    async updateUser(req, reply) {
        const { id } = req.params
        const user = await UserService.updateUser(id, req.body)
        return reply.send({ success: true, data: user, message: 'User updated successfully' })
    },

    async deleteUser(req, reply) {
        const { id } = req.params
        await UserService.deleteUser(id)
        return reply.send({ success: true, data: null, message: 'User deleted successfully' })
    },
    
    async loginUser(req, reply) {
        const result = await UserService.loginUser(req.body)
        return reply.send({ success: true, data: result, message: 'Login successful' })
    },

    async logoutUser(req, reply) {
        await UserService.logoutUser(req.user.id)
        return reply.send({ success: true, data: null, message: 'Logout successful' })
    },

    async refreshToken(req, reply) {
        const { refreshToken } = req.body
        const result = await UserService.refresh(refreshToken)
        return reply.send({ success: true, data: result, message: 'Token refreshed successfully' })
    },

    async updatePassword(req, reply) {
        const { id } = req.params
        await UserService.updatePassword(id, req.body);
        return reply.send({ success: true, data: null, message: 'Password updated successfully' })
    },
}