import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import UserModel from './user.model.js'

import { createUserDTO, updateUserDTO, loginUserDTO } from './user.dto.js'
import AppError from '../../errors/AppError.js'


export const UserService = {
    async findAll() {
        return await UserModel.find()
    },

    async findById(id) {
        const user = await UserModel.findById(id)
        if (!user) {
            throw new AppError('User not found', 404)
        }
        return user
    },

    async createUser(body) {
        const userDTO = createUserDTO(body)
        userDTO.password = await argon2.hash(userDTO.password)
        return await UserModel.create(userDTO)
    },

    async updateUser(id, body) {
        const userDTO = updateUserDTO(body)
        const user = await UserModel.findByIdAndUpdate(id, { $set: userDTO }, { new: true, runValidators: true })

        if (!user) {
            throw new AppError('User not found', 404)
        }

        return user
    },

    async deleteUser(id) {
        const user = await UserModel.findByIdAndDelete(id)
        if (!user) {
            throw new AppError('User not found', 404)
        }
        return null
    },

    async loginUser(body) {
        const userDTO = loginUserDTO(body)
        const {email, password} = userDTO
        const user = await UserModel.findOne({ email })
        if (!user) {
            throw new AppError('Email ou senha incorretos', 401)
        }
        const valid = await argon2.verify(user.password, password)
        if (!valid) {
            throw new AppError('Email ou senha incorretos', 401)
        }
        const accessToken = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '24h' })
        const refreshToken = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d' })
        user.tokenRefresh = refreshToken
        await user.save()
        return { accessToken, refreshToken, user: user.toJSON()}
    },

    async logoutUser(id) {
        const user = await UserModel.findById(id)
        if (!user) {
            throw new AppError('User not found', 404)
        }
        user.tokenRefresh = null
        await user.save()
        return null
    },

    async refresh(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)

            console.log(decoded)

            const user = await UserModel.findById(decoded.id)

            console.log(user)

            if (!user) {
                throw new AppError("User not found", 404)
            }

            if (user.tokenRefresh !== refreshToken) {
                throw new AppError("Invalid refresh token", 401)
            }

            const newAccessToken = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            )

            return { accessToken: newAccessToken }

        } catch (error) {
            console.log(error) // <-- MUITO IMPORTANTE
            throw error
        }
    },

    async updatePassword(id, body) {
        const { currentPassword, newPassword } = body
        const user = await UserModel.findById(id)
        if (!user) {
            throw new AppError('User not found', 404)
        }
        const valid = await argon2.verify(user.password, currentPassword)
        if (!valid) {
            throw new AppError('Invalid current password', 401) 
        }
        user.password = await argon2.hash(newPassword)
        await user.save()
        return null
    },
}