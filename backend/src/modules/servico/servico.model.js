// modules/servico/servico.model.js
import mongoose from 'mongoose';

const servicoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priceNormal: { type: Number, required: true },
    pricePromotional: { type: Number, required: true },
    diasPromocionais: { type: [Number], default: [] }, // 0=dom ... 6=sáb. vazio = nunca em promoção
  },
  { timestamps: true }
);

export const ServicoModel = mongoose.model('Servico', servicoSchema);