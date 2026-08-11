import {UserController} from './user.controller.js'
import { authenticate, authorize } from '../shared/middlewares/auth.middleware.js'

export async function userRoutes(fastify) {

    // public routes
    fastify.post('/users', UserController.createUser);
    fastify.post('/users/login', UserController.loginUser);
    fastify.post('/users/refresh', UserController.refreshToken);

    fastify.register(async function (fastify) {
        
        fastify.addHook('preHandler', authenticate);

        // protected routes
        fastify.get('/users',
            {
                preHandler: authorize([
                    'super_admin',
                ])
            }, UserController.getAllUsers);
        fastify.get('/users/:id', UserController.getUserById);
        fastify.patch('/users/:id', UserController.updateUser);
        fastify.post('/users/:id/password', UserController.updatePassword);
        fastify.delete('/users/:id', {
                preHandler: authorize([
                    'super_admin',
                ])
            }, UserController.deleteUser);
        fastify.post('/users/logout', UserController.logoutUser);
    })
}