// modules/orderHistory/orderHistory.service.js
import { OrderHistoryModel } from './orderHistory.model.js';
import { ItemModel } from '../item/item.model.js';
import { calculateItemPrice } from '../shared/utils/priceCalculator.js';

export async function createOrder(dto) {
  if (dto.sinal !== true) {
    const erro = new Error('Não é possível criar o pedido sem o pagamento do sinal.');
    erro.statusCode = 400;
    throw erro;
  }

  // busca os itens no banco pra pegar o preço real (nunca confiar em preço vindo do client)
  const itemIds = dto.items.map((i) => i.itemId);
  const itensDoBanco = await ItemModel.find({ _id: { $in: itemIds } });

  const itemsComPreco = dto.items.map((linha) => {
    const itemDb = itensDoBanco.find((i) => i._id.toString() === linha.itemId);
    if (!itemDb) throw new Error(`Item ${linha.itemId} não encontrado`);

    const precoUnitario = calculateItemPrice(itemDb);
    return {
      itemId: itemDb._id,
      quantidade: linha.quantidade || 1,
      precoUnitario,
    };
  });

  const total = itemsComPreco.reduce(
    (soma, i) => soma + i.precoUnitario * i.quantidade,
    0
  );

  const order = await OrderHistoryModel.create({
    ...dto,
    items: itemsComPreco,
    total,
  });

  return order;
}

export async function listOrders(filtros = {}) {
  return OrderHistoryModel.find(filtros)
    .populate('customerId')
    .populate('items.itemId')
    .populate('userId', 'nome role')
    .sort({ createdAt: -1 });
}

export async function getOrderById(id) {
  return OrderHistoryModel.findById(id)
    .populate('customerId')
    .populate('items.itemId')
    .populate('userId', 'nome role');
}