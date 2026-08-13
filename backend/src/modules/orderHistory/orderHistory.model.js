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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    typePayment: { 
      type: String, 
      enum: ['pix', 'dinheiro', 'cartao'], 
      required: true 
    },
    agenda: { 
      type: Date, 
      default: null
      // Data/hora do agendamento (9h às 18:30, slots de 30 min, máx 10 por slot)
      // Obrigatório apenas para serviços
    },
    numeroAtendimento: { 
      type: String, 
      default: null
      // Formato: "0001" (reseta diariamente) - apenas para serviços
    },
    status: {
      type: String,
      enum: ['AGENDADO', 'FINALIZADO', 'CANCELADO'],
      default: 'AGENDADO'
      // AGENDADO: Pedido registrado, aguardando execução
      // FINALIZADO: Serviço foi realizado ou produto foi entregue
      // CANCELADO: Pedido cancelado
    },
    dataFinalizacao: {
      type: Date,
      default: null
      // Data/hora quando o serviço foi finalizado ou produto entregue
    },
  },
  { timestamps: true } // createdAt já cobre data + hora
);

export const OrderHistoryModel = mongoose.model('OrderHistory', orderHistorySchema);