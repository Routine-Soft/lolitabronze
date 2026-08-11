// modules/cash/cashMovement.model.js
import mongoose from 'mongoose';
import { MOVEMENT_TYPE, MOVEMENT_CATEGORY } from '../shared/enums/cashMovement.enum.js';

const cashMovementSchema = new mongoose.Schema(
  {
    cashSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashSession', required: true },
    tipo: { type: String, enum: Object.values(MOVEMENT_TYPE), required: true },
    categoria: { type: String, enum: Object.values(MOVEMENT_CATEGORY), required: true },
    valor: { type: Number, required: true },
    descricao: { type: String, trim: true },
    orderHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderHistory', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CashMovementModel = mongoose.model('CashMovement', cashMovementSchema);