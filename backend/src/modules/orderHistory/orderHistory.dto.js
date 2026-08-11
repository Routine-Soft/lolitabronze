// modules/orderHistory/orderHistory.dto.js
export function toCreateOrderDto(body) {
  return {
    customerId: body.customerId,
    items: body.items, // [{ itemId, quantidade }]
    observacao: body.observacao,
    sinal: body.sinal,
    userId: body.userId, // vem do usuário autenticado, não do body do cliente
  };
}

export function toOrderResponseDto(order) {
  const createdAt = order.createdAt;
  return {
    id: order._id,
    customerId: order.customerId,
    items: order.items,
    observacao: order.observacao,
    total: order.total,
    sinal: order.sinal,
    userId: order.userId,
    dia: createdAt.toLocaleDateString('pt-BR'),
    hora: createdAt.toLocaleTimeString('pt-BR'),
    createdAt,
  };
}