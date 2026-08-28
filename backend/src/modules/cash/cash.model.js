// modules/cash/cash.model.js
import mongoose from 'mongoose';

const cashSessionSchema = new mongoose.Schema(
  {
    dataAbertura: { type: Date, required: true, default: Date.now },
    dataFechamento: { type: Date, default: null },
    valorAbertura: { type: Number, required: true },
    valorFechamentoContado: { type: Number, default: null },
    valorFechamentoEsperado: { type: Number, default: null },
    diferenca: { type: Number, default: null },
    status: { type: String, enum: ['ABERTO', 'FECHADO'], default: 'ABERTO' },
    userAbertura: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    userFechamento: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
  },
  { timestamps: true }
);

const cashMovementSchema = new mongoose.Schema(
  {
    cashSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashSession', required: true },
    tipo: { type: String, enum: ['ENTRADA', 'SAIDA'], required: true },
    categoria: {
      type: String,
      enum: ['VENDA', 'SINAL', 'COMPLEMENTO', 'DESPESA', 'SANGRIA', 'REFORCO', 'REEMBOLSO', 'OUTRO'],
      required: true,
    },
    valor: { type: Number, required: true },
    descricao: { type: String, trim: true },
    typePayment: { type: String, enum: ['pix', 'dinheiro', 'cartao'], default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  },
  { timestamps: true }
);

export const CashSessionModel = mongoose.model('CashSession', cashSessionSchema);
export const CashMovementModel = mongoose.model('CashMovement', cashMovementSchema);