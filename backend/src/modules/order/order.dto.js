// modules/order/order.dto.js
export function toCreateOrderDto(body) {
  const base = {
    customerId: body.customerId,
    userId: body.userId, // vem do usuário autenticado, não do body do cliente
    tipo: body.tipo, // 'PRODUTO' | 'SERVICO'
    observacao: body.observacao,
    typePayment: body.typePayment, // 'pix', 'dinheiro', 'cartao'
  };

  if (body.tipo === 'PRODUTO') {
    return {
      ...base,
      produtos: body.produtos, // [{ produtoId, quantidade }]
    };
  }

  // tipo === 'SERVICO'
  return {
    ...base,
    servicoId: body.servicoId,
    agenda: body.agenda, // Data ISO string (será validada e convertida para Date)
    sinalPago: body.sinalPago === true, // true = pagou só os R$20 hoje
  };
}

export function toOrderResponseDto(order) {
  const createdAt = order.createdAt;

  const agendaFormatada = order.agenda
    ? new Date(order.agenda).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return {
    id: order._id,
    customerId: order.customerId,
    userId: order.userId,
    tipo: order.tipo,

    produtos: order.produtos,

    servicoId: order.servicoId,
    agenda: order.agenda,           // continua cru, em UTC (útil pro frontend fazer cálculos)
    agendaFormatada,                // <- pronto pra exibir na tela, ex: "21/08/2026 15:30"
    numeroAtendimento: order.numeroAtendimento,
    sinalPago: order.sinalPago,

    total: order.total,
    valorPago: order.valorPago,
    valorRestante: order.total - order.valorPago,

    observacao: order.observacao,
    typePayment: order.typePayment,
    status: order.status,
    dataFinalizacao: order.dataFinalizacao,

    dia: createdAt.toLocaleDateString('pt-BR'),
    hora: createdAt.toLocaleTimeString('pt-BR'),
    createdAt,
  };
}

export function toComandaResponseDto(order) {
  const total = order.itens.reduce((s, i) => s + (i.tipo === 'PRODUTO' ? i.precoUnitario * i.quantidade : i.precoUnitario), 0);
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
    })),
    total,
    totalPago,
    totalPendente: total - totalPago,
    observacao: order.observacao,
    dataFechamento: order.dataFechamento,
    createdAt: order.createdAt,
  };
}