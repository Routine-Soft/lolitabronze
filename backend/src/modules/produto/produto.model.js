// modules/produto/produto.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const produtoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priceNormal: { type: Number, required: true },
    pricePromotional: { type: Number, required: true },
    diasPromocionais: { type: [Number], default: [] }, // 0=dom ... 6=sáb. vazio = nunca em promoção
    quantity: { type: Number, default: null },
  },
  { timestamps: true }
);

export const ProdutoModel = mongoose.model('Produto', produtoSchema);