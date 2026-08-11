import Fastify from "fastify";
import fastifyCors from '@fastify/cors'
import dotenv from "dotenv"
import db from './src/db/db.js'
import { userRoutes } from "./src/modules/user/user.routes.js";
import { cashRoutes } from "./src/modules/cash/cash.routes.js";
import { customerRoutes } from "./src/modules/customer/customer.routes.js";
import { itemRoutes } from "./src/modules/item/item.routes.js";
import { orderHistoryRoutes } from "./src/modules/orderHistory/orderHistory.routes.js";
import { printRoutes } from "./src/modules/print/print.routes.js";


dotenv.config();
const fastify = Fastify({ logger: true })

await fastify.register(fastifyCors, {            // 👈
  origin: true,                           // libera qualquer origem (em prod troca pelo domínio)
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

/* =====================================
   Error Handler Global
===================================== */

fastify.setErrorHandler((error, request, reply) => {

  fastify.log.error(error)

  return reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Erro interno do servidor'
  })
})

// * ========== ROUTERS ======== *
await fastify.register(userRoutes, {prefix: '/api'});
await fastify.register(cashRoutes, {prefix: '/api'});
await fastify.register(customerRoutes, {prefix: '/api'});
await fastify.register(itemRoutes, {prefix: '/api'});
await fastify.register(orderHistoryRoutes, {prefix: '/api'});
await fastify.register(printRoutes, {prefix: '/api'});

// Conexão com MongoDB e start do servidor
const start = async () => {
  try {
    await db()

    await fastify.listen({ port: process.env.PORT || 8080, host: '0.0.0.0' })
    console.log(`🚀 Servidor rodando na porta ${process.env.PORT || 8080}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()