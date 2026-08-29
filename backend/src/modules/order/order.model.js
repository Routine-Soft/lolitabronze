// modules/order/order.model.js
import mongoose from 'mongoose';

export const SINAL_VALOR = 20;

const produtoItemSchema = new mongoose.Schema(
  {
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
    quantidade: { type: Number, default: 1 },
    precoUnitario: { type: Number, required: true },
  },
  { _id: false }
);

// item de comanda — pode ser PRODUTO ou SERVICO
const comandaItemSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['PRODUTO', 'SERVICO'], required: true },

    // PRODUTO
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', default: null },
    quantidade: { type: Number, default: 1 },

    // SERVICO
    servicoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', default: null },
    agenda: { type: Date, default: null },
    numeroAtendimento: { type: String, default: null },
    statusServico: { type: String, enum: ['AGENDADO', 'FINALIZADO', 'CANCELADO', null], default: null },
    sinalPago: { type: Boolean, default: false },

    // comum
    precoUnitario: { type: Number, required: true },
    valorPago: { type: Number, default: 0 },
    typePayment: { type: String, enum: ['pix', 'dinheiro', 'cartao'], default: null },
    faturado: { type: Boolean, default: false },
    dataFaturamento: { type: Date, default: null },
    valorFaturado: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

    // ====== NOVO: modelo de comanda (usado a partir de agora) ======
    status: {
      type: String,
      enum: ['ABERTA', 'FECHADA', 'CANCELADA', 'AGENDADO', 'FINALIZADO', 'CANCELADO'],
      default: 'ABERTA',
    },
    itens: { type: [comandaItemSchema], default: [] },
    dataFechamento: { type: Date, default: null },

    // ====== LEGADO: campos do modelo antigo (pedido fecha na hora) ======
    // mantidos apenas para não quebrar pedidos já existentes no banco.
    // novos pedidos não preenchem mais esses campos.
    tipo: { type: String, enum: ['PRODUTO', 'SERVICO'], default: null },
    produtos: { type: [produtoItemSchema], default: [] },
    servicoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', default: null },
    agenda: { type: Date, default: null },
    numeroAtendimento: { type: String, default: null },
    sinalPago: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    valorPago: { type: Number, default: 0 },
    dataFinalizacao: { type: Date, default: null },
    faturado: { type: Boolean, default: false },
    dataFaturamento: { type: Date, default: null },
    valorFaturado: { type: Number, default: 0 },

    observacao: { type: String, trim: true },
    typePayment: { type: String, enum: ['pix', 'dinheiro', 'cartao'], default: null },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model('Order', orderSchema);