// Cash Service - Chamadas à API de caixa
import apiService from '../../services/api.js'
import {
  openCashSessionDTO,
  closeCashSessionDTO,
  createMovementDTO,
  cashSessionResponseDTO,
  movementResponseDTO,
} from './cash.dto.js'

export const CashService = {
  // Abrir caixa - Protegido
  async openSession(valorAbertura, userAbertura) {
    const dto = openCashSessionDTO({ valorAbertura, userAbertura })
    const response = await apiService.post('/cash/open', dto)
    return cashSessionResponseDTO(response.data)
  },

  // Fechar caixa - Protegido
  async closeSession(sessionId, valorFechamentoContado, userFechamento) {
    const dto = closeCashSessionDTO({ valorFechamentoContado, userFechamento })
    const response = await apiService.post(`/cash/${sessionId}/close`, dto)
    return response.data
  },

  // Adicionar movimentação - Protegido
  async addMovement(tipo, categoria, valor, descricao, userId, typePayment = null, orderHistoryId = null) {
    const dto = createMovementDTO({
      tipo,
      categoria,
      valor,
      descricao,
      typePayment,
      userId,
      orderHistoryId,
    })
    const response = await apiService.post('/cash/movement', dto)
    return movementResponseDTO(response.data)
  },

  // Obter caixa aberto - Protegido
  async getCurrent() {
    const response = await apiService.get('/cash/current')
    return response.data ? cashSessionResponseDTO(response.data) : null
  },

  // Listar movimentações - Protegido
  async getMovements(sessionId = null) {
    const query = sessionId ? `?sessionId=${sessionId}` : ''
    const response = await apiService.get(`/cash/movements${query}`)
    return (response.data || []).map(movementResponseDTO)
  },
}

export default CashService

// Services específicos para movementação
export const CashMovementService = {
  // Registrar entrada de venda
  async registrarVenda(valor, descricao, userId, typePayment = null, orderHistoryId) {
    return CashService.addMovement('ENTRADA', 'VENDA', valor, descricao, userId, typePayment, orderHistoryId)
  },

  // Registrar sinal (adiantamento)
  async registrarSinal(valor, descricao, userId, typePayment = null) {
    return CashService.addMovement('ENTRADA', 'SINAL', valor, descricao, userId, typePayment)
  },

  // Registrar complemento
  async registrarComplemento(valor, descricao, userId, typePayment = null, orderHistoryId) {
    return CashService.addMovement('ENTRADA', 'COMPLEMENTO', valor, descricao, userId, typePayment, orderHistoryId)
  },

  // Registrar despesa
  async registrarDespesa(valor, descricao, userId) {
    return CashService.addMovement('SAIDA', 'DESPESA', valor, descricao, userId)
  },

  // Registrar sangria (retirada)
  async registrarSangria(valor, descricao, userId) {
    return CashService.addMovement('SAIDA', 'SANGRIA', valor, descricao, userId)
  },

  // Registrar reforço (entrada extra)
  async registrarReforco(valor, descricao, userId) {
    return CashService.addMovement('ENTRADA', 'REFORCO', valor, descricao, userId)
  },
}

// Service para sessão de caixa
export const CashSessionService = {
  open: CashService.openSession,
  close: CashService.closeSession,
  getCurrent: CashService.getCurrent,
}
