// fallback quando não há CashMovement (ex.: pagamento feito sem caixa aberto) — usa o que ficou gravado no próprio item
function formasPagamentoDosItens(itens) {
  const somaPorForma = {};
  for (const i of itens) {
    if (i.valorPago > 0) {
      const chave = i.typePayment ?? 'nao_informado';
      somaPorForma[chave] = (somaPorForma[chave] ?? 0) + i.valorPago;
    }
  }
  return Object.entries(somaPorForma).map(([typePayment, valor]) => ({ typePayment, valor }));
}

export function toOrderResponseDto(order, formasPagamento = []) {
  const total = order.itens.reduce(
    (s, i) => s + (i.tipo === 'PRODUTO' ? i.precoUnitario * i.quantidade : i.precoUnitario),
    0
  );
  const totalPago = order.itens.reduce((s, i) => s + i.valorPago, 0);
  const formasPagamentoFinal = formasPagamento.length > 0 ? formasPagamento : formasPagamentoDosItens(order.itens);

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
      faturado: i.faturado,
      dataFaturamento: i.dataFaturamento,
      valorFaturado: i.valorFaturado,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
    total,
    totalPago,
    totalPendente: total - totalPago,
    formasPagamento: formasPagamentoFinal,
    observacao: order.observacao,
    dataFechamento: order.dataFechamento,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}