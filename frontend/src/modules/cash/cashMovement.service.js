// Cash Movement Service - Atalhos para movimentações específicas
import CashService from './cash.service.js'

export const CashMovementService = {
  // Registrar entrada de venda
  async registrarVenda(valor, descricao, userId, orderHistoryId) {
    return CashService.addMovement('ENTRADA', 'VENDA', valor, descricao, userId, orderHistoryId)
  },

  // Registrar sinal (adiantamento)
  async registrarSinal(valor, descricao, userId) {
    return CashService.addMovement('ENTRADA', 'SINAL', valor, descricao, userId)
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

export default CashMovementService

