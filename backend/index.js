import Fastify from "fastify";
import fastifyCors from '@fastify/cors'
import dotenv from "dotenv"
import db from './src/db/db.js'
import { userRoutes } from "./src/modules/user/user.routes.js";
import { cashRoutes } from "./src/modules/cash/cash.routes.js";
import { customerRoutes } from "./src/modules/customer/customer.routes.js";
import { servicoRoutes } from "./src/modules/servico/servico.routes.js";
import { produtoRoutes } from "./src/modules/produto/produto.routes.js";
import { orderRoutes } from "./src/modules/order/order.routes.js";
import { printRoutes } from "./src/modules/print/print.routes.js";
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

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
await fastify.register(servicoRoutes, {prefix: '/api'});
await fastify.register(produtoRoutes, {prefix: '/api'});
await fastify.register(orderRoutes, {prefix: '/api'});
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