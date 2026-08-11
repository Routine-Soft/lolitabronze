// modules/item/item.model.js
import mongoose from 'mongoose';
import { ITEM_TYPE } from '../shared/enums/itemType.enum.js';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: Object.values(ITEM_TYPE), required: true },
    price: { type: Number, required: true },
    quantity: {
      type: Number,
      required: function () { return this.type === ITEM_TYPE.PRODUCT; },
      default: null,
    },
    // desconto opcional em dias específicos da semana (0=domingo ... 6=sábado)
    discount: {
      diasSemana: { type: [Number], default: [] }, // ex: [1,2,3] = seg, ter, qua
      percentual: { type: Number, default: 0 },     // ex: 10 = 10%
    },
  },
  { timestamps: true }
);

export const ItemModel = mongoose.model('Item', itemSchema);