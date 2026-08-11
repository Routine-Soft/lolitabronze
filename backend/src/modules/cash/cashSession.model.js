// modules/cash/cashSession.model.js
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
    userAbertura: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userFechamento: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const CashSessionModel = mongoose.model('CashSession', cashSessionSchema);