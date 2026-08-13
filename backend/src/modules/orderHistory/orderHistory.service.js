// modules/orderHistory/orderHistory.service.js
import { OrderHistoryModel } from './orderHistory.model.js';
import { ItemModel } from '../item/item.model.js';
import UserModel from '../user/user.model.js';
import { CashMovementModel } from '../cash/cashMovment.model.js';
import { CashSessionModel } from '../cash/cashSession.model.js';
import { calculateItemPrice } from '../shared/utils/priceCalculator.js';

// ====== VALIDAÇÕES ======

/**
 * Valida se a agenda (data/hora) é válida
 * - Deve estar entre 9:00 e 18:30
 * - Deve estar em slots de 30 minutos (9:00, 9:30, 10:00, etc)
 * - Domingo a domingo
 */
function validateAgenda(agendaDate) {
  const date = new Date(agendaDate);
  
  if (isNaN(date.getTime())) {
    const erro = new Error('Data de agendamento inválida');
    erro.statusCode = 400;
    throw erro;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Validar horário (9:00 às 18:30)
  if (hours < 9 || hours > 18 || (hours === 18 && minutes > 30)) {
    const erro = new Error('Horário deve estar entre 09:00 e 18:30');
    erro.statusCode = 400;
    throw erro;
  }

  // Validar slots de 30 minutos (deve ser :00 ou :30)
  if (minutes !== 0 && minutes !== 30) {
    const erro = new Error('Agendamento deve estar em slots de 30 minutos (9:00, 9:30, 10:00, etc)');
    erro.statusCode = 400;
    throw erro;
  }

  // Validar que os segundos são 0
  if (date.getSeconds() !== 0) {
    date.setSeconds(0);
    date.setMilliseconds(0);
  }
}

/**
 * Valida tipo de pagamento
 */
function validateTypePayment(typePayment) {
  const validTypes = ['pix', 'dinheiro', 'cartao'];
  if (!validTypes.includes(typePayment)) {
    const erro = new Error(`Tipo de pagamento deve ser um de: ${validTypes.join(', ')}`);
    erro.statusCode = 400;
    throw erro;
  }
}

/**
 * Verifica quantos pedidos já existem no slot de agendamento
 */
async function getOrdersCountInSlot(agendaDate) {
  const slotStart = new Date(agendaDate);
  slotStart.setSeconds(0);
  slotStart.setMilliseconds(0);

  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30);

  const count = await OrderHistoryModel.countDocuments({
    agenda: {
      $gte: slotStart,
      $lt: slotEnd,
    },
  });

  return count;
}

/**
 * Gera número de atendimento (contador diário que reseta)
 * Formato: "0001", "0002", etc
 * Conta APENAS serviços (sinal: true), não produtos
 */
async function generateNumeroAtendimento() {
  // Obter início e fim do dia atual
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Contar APENAS serviços criados hoje (sinal: true)
  const count = await OrderHistoryModel.countDocuments({
    createdAt: {
      $gte: hoje,
      $lt: amanha,
    },
    sinal: true,
  });

  // Próximo número (count + 1), formatado com zeros à esquerda
  return String(count + 1).padStart(4, '0');
}

// ====== FUNÇÕES PRINCIPAIS ======

export async function createOrder(dto) {
  // Validar typePayment
  validateTypePayment(dto.typePayment);

  // Busca os itens no banco pra pegar o preço real (nunca confiar em preço vindo do client)
  const itemIds = dto.items.map((i) => i.itemId);
  const itensDoBanco = await ItemModel.find({ _id: { $in: itemIds } });

  // Verificar se há serviços na ordem
  const temServico = itensDoBanco.some((item) => item.type === 'SERVICE');

  // Se tem serviço, sinal e agenda são obrigatórios
  let numeroAtendimento = null;
  if (temServico) {
    if (dto.sinal !== true) {
      const erro = new Error('Serviços requerem pagamento de sinal de R$ 20,00 para confirmar o agendamento.');
      erro.statusCode = 400;
      throw erro;
    }
    
    // Validar agenda apenas se tiver serviço
    validateAgenda(dto.agenda);

    // Verificar limite de 10 vagas por slot
    const ordersInSlot = await getOrdersCountInSlot(dto.agenda);
    if (ordersInSlot >= 10) {
      const erro = new Error('Este horário está lotado. Máximo 10 agendamentos por slot.');
      erro.statusCode = 400;
      throw erro;
    }

    // Gerar número de atendimento APENAS para serviços
    numeroAtendimento = await generateNumeroAtendimento();
  }

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
    numeroAtendimento,
  });

  // Buscar sessão aberta do dia (usada para sinal e venda de produto)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const sessaoAberta = await CashSessionModel.findOne({
    status: 'ABERTO',
    createdAt: {
      $gte: hoje,
      $lt: amanha,
    },
  });

  // Registrar sinal no caixa (somente se sinal === true = serviço agendado)
  if (dto.sinal === true && sessaoAberta) {
    await CashMovementModel.create({
      cashSessionId: sessaoAberta._id,
      tipo: 'ENTRADA',
      categoria: 'SINAL',
      valor: 20,
      typePayment: dto.typePayment,
      descricao: `Sinal do serviço #${numeroAtendimento}`,
      orderHistoryId: order._id,
      userId: dto.userId,
    });
  }

  // Registrar venda de produto no caixa (somente se sinal === false = produto)
  if (dto.sinal === false && sessaoAberta) {
    await CashMovementModel.create({
      cashSessionId: sessaoAberta._id,
      tipo: 'ENTRADA',
      categoria: 'VENDA',
      valor: total,
      typePayment: dto.typePayment,
      descricao: `Venda de produto`,
      orderHistoryId: order._id,
      userId: dto.userId,
    });
  }

  return order;
}

export async function listOrders(filtros = {}) {
  return OrderHistoryModel.find(filtros)
    .populate('customerId')
    .populate('items.itemId')
    .populate('userId')
    .sort({ createdAt: -1 });
}

export async function getOrderById(id) {
  return OrderHistoryModel.findById(id)
    .populate('customerId')
    .populate('items.itemId')
    .populate('userId');
}

/**
 * Retorna disponibilidade de slots para um dia específico
 * @param {string} dateStr - Data em formato YYYY-MM-DD
 * @returns {Array} Array com objeto de cada slot contendo horário, vagas preenchidas, vagas restantes, e disponibilidade
 */
export async function getSlotAvailability(dateStr) {
  // Parse data
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dateEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  // Gerar todos os slots de 30 minutos (9:00 - 18:30)
  const slots = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) break; // Para em 18:00 (último slot é 18:00-18:30)
      
      const slotStart = new Date(year, month - 1, day, h, m, 0, 0);
      const slotEnd = new Date(year, month - 1, day, h, m + 30, 0, 0);

      // Contar pedidos neste slot
      const count = await OrderHistoryModel.countDocuments({
        agenda: {
          $gte: slotStart,
          $lt: slotEnd,
        },
      });

      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const vagasPreenchidas = count;
      const vagasRestantes = Math.max(0, 10 - count);
      const disponivel = count < 10;

      slots.push({
        horario: timeStr,
        vagasPreenchidas,
        vagasRestantes,
        disponivel,
      });
    }
  }

  return slots;
}

/**
 * Finaliza um serviço agendado e registra o complemento no caixa
 * @param {string} orderId - ID da ordem
 * @param {string} userId - ID do usuário que está finalizando
 * @param {string} typePayment - Tipo de pagamento do complemento ('pix', 'dinheiro', 'cartao')
 * @returns {Object} Ordem finalizada
 */
export async function finalizarServicoAgendado(orderId, userId, typePayment) {
  // Validar que a ordem existe
  const order = await OrderHistoryModel.findById(orderId);
  if (!order) {
    const erro = new Error('Ordem não encontrada');
    erro.statusCode = 404;
    throw erro;
  }

  // Validar que a ordem tem serviço (numeroAtendimento não é nulo)
  if (!order.numeroAtendimento) {
    const erro = new Error('Apenas serviços agendados podem ser finalizados');
    erro.statusCode = 400;
    throw erro;
  }

  // Validar que ainda não foi finalizado
  if (order.status === 'FINALIZADO') {
    const erro = new Error('Esta ordem já foi finalizada');
    erro.statusCode = 400;
    throw erro;
  }

  // Atualizar status e dataFinalizacao
  order.status = 'FINALIZADO';
  order.dataFinalizacao = new Date();
  await order.save();

  // Registrar complemento no caixa (somente se houver complemento a pagar)
  const valorComplemento = order.total - (order.sinal ? 20 : 0); // Sinal padrão é 20

  if (valorComplemento > 0) {
    // Buscar sessão aberta do dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const sessaoAberta = await CashSessionModel.findOne({
      status: 'ABERTO',
      createdAt: {
        $gte: hoje,
        $lt: amanha,
      },
    });

    if (!sessaoAberta) {
      const erro = new Error('Nenhuma sessão de caixa aberta para hoje');
      erro.statusCode = 400;
      throw erro;
    }

    // Criar movimento de complemento com typePayment
    await CashMovementModel.create({
      cashSessionId: sessaoAberta._id,
      tipo: 'ENTRADA',
      categoria: 'COMPLEMENTO',
      valor: valorComplemento,
      typePayment,
      descricao: `Complemento do serviço #${order.numeroAtendimento}`,
      orderHistoryId: orderId,
      userId,
    });
  }

  return order;
}
