import mongoose from 'mongoose';

export const SINAL_VALOR = 20;

const itemSchema = new mongoose.Schema(
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
    status: { type: String, enum: ['ABERTA', 'FECHADA', 'CANCELADA'], default: 'ABERTA' },
    itens: { type: [itemSchema], default: [] },
    observacao: { type: String, trim: true, default: '' },
    dataFechamento: { type: Date, default: null },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model('Order', orderSchema);