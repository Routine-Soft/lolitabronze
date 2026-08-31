export function toOrderResponseDto(order) {
  const total = order.itens.reduce(
    (s, i) => s + (i.tipo === 'PRODUTO' ? i.precoUnitario * i.quantidade : i.precoUnitario),
    0
  );
  const totalPago = order.itens.reduce((s, i) => s + i.valorPago, 0);

  return {
    id: order._id,
    customerId: order.customerId,
    userId: order.userId,
    status: order.status,
    itens: order.itens.map((i) => ({
      id: i._id,
      tipo: i.tipo,
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      servicoId: i.servicoId,
      agenda: i.agenda,
      numeroAtendimento: i.numeroAtendimento,
      statusServico: i.statusServico,
      sinalPago: i.sinalPago,
      precoUnitario: i.precoUnitario,
      valorPago: i.valorPago,
      valorTotal: i.tipo === 'PRODUTO' ? i.precoUnitario * i.quantidade : i.precoUnitario,
      typePayment: i.typePayment,
    })),
    total,
    totalPago,
    totalPendente: total - totalPago,
    observacao: order.observacao,
    dataFechamento: order.dataFechamento,
    createdAt: order.createdAt,
  };
}