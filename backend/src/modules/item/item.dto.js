// modules/item/item.dto.js
import { calculateItemPrice } from '../shared/utils/priceCalculator.js';

export function toCreateItemDto(body) {
  return {
    name: body.name,
    description: body.description,
    type: body.type,
    price: body.price,
    quantity: body.quantity ?? null,
    discount: body.discount ?? { diasSemana: [], percentual: 0 },
  };
}

export function toItemResponseDto(item) {
  return {
    id: item._id,
    name: item.name,
    description: item.description,
    type: item.type,
    price: item.price,
    precoHoje: calculateItemPrice(item), // preço já considerando desconto do dia
    quantity: item.quantity,
    discount: item.discount,
  };
}