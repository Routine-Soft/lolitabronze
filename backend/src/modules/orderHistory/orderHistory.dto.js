// modules/orderHistory/orderHistory.dto.js
export function toCreateOrderDto(body) {
  return {
    customerId: body.customerId,
    items: body.items, // [{ itemId, quantidade }]
    observacao: body.observacao,
    sinal: body.sinal,
    userId: body.userId, // vem do usuário autenticado, não do body do cliente
    typePayment: body.typePayment, // 'pix', 'dinheiro', 'cartao'
    agenda: body.agenda, // Data ISO string (será validada e convertida para Date)
  };
}

export function toOrderResponseDto(order) {

  const createdAt = order.createdAt;

  // const agendaFormatted = order.agenda
  //   ? new Date(order.agenda).toLocaleString('pt-BR', {
  //       day: '2-digit',
  //       month: '2-digit',
  //       year: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit',
  //     })
  //   : '';

  return {

    id: order._id,

    customerId: order.customerId,

    items: order.items,

    observacao: order.observacao,

    total: order.total,

    sinal: order.sinal,

    userId: order.userId,

    typePayment: order.typePayment,

    agenda: order.agenda,

    numeroAtendimento: order.numeroAtendimento,

    status: order.status,

    dataFinalizacao: order.dataFinalizacao,

    dia: createdAt.toLocaleDateString('pt-BR'),

    hora: createdAt.toLocaleTimeString('pt-BR'),

    createdAt,
  };
}