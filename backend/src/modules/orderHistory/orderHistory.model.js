// modules/orderHistory/orderHistory.model.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    quantidade: { type: Number, default: 1 },
    precoUnitario: { type: Number, required: true }, // preço já com desconto aplicado no momento da venda
  },
  { _id: false }
);

const orderHistorySchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [orderItemSchema], required: true },
    observacao: { type: String, trim: true },
    total: { type: Number, required: true },
    sinal: { type: Boolean, required: true }, // precisa ser true pra existir o registro
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true } // createdAt já cobre data + hora
);

export const OrderHistoryModel = mongoose.model('OrderHistory', orderHistorySchema);