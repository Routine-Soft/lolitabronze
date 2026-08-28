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

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

    tipo: { type: String, enum: ['PRODUTO', 'SERVICO'], required: true },

    // preenchido só quando tipo = PRODUTO
    produtos: { type: [produtoItemSchema], default: [] },

    // preenchido só quando tipo = SERVICO
    servicoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', default: null },

    agenda: { type: Date, default: null },

    numeroAtendimento: { type: String, default: null },
    
    sinalPago: { type: Boolean, default: false }, // true = hoje pagou só os R$20 de sinal

    total: { type: Number, required: true },      // valor total da compra/serviço
    valorPago: { type: Number, required: true },   // valor que entrou no caixa HOJE (sinal ou total)

    observacao: { type: String, trim: true },
    typePayment: { type: String, enum: ['pix', 'dinheiro', 'cartao'], required: true },

    status: {
      type: String,
      enum: ['AGENDADO', 'FINALIZADO', 'CANCELADO'],
      default: 'AGENDADO',
    },

    dataFinalizacao: { type: Date, default: null },

    faturado: { type: Boolean, default: false },
    dataFaturamento: { type: Date, default: null },
    valorFaturado: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model('Order', orderSchema);