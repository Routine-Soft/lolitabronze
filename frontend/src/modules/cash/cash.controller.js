// Cash Controller - Lógica de gerenciamento de caixa
import CashService, { CashMovementService, CashSessionService } from '../cash/cash.service.js'
import { validateOpenSession, validateCloseSession, validateMovement } from '../cash/cash.dto.js'

export class CashController {
  constructor() {
    this.currentSession = null
    this.movements = []
    this.loading = false
    this.error = null
    this.observers = []
  }

  subscribe(callback) {
    this.observers.push(callback)
  }

  notify() {
    this.observers.forEach(callback => callback())
  }

  // Obter sessão atual
  async getCurrent() {
    this.loading = true
    this.error = null

    try {
      this.currentSession = await CashService.getCurrent()
      this.notify()
      return this.currentSession
    } catch (error) {
      this.error = error.message || 'Erro ao buscar sessão atual'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Abrir caixa
  async openSession(valorAbertura, userAbertura) {
    this.loading = true
    this.error = null

    try {
      const validation = validateOpenSession({ valorAbertura, userAbertura })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      this.currentSession = await CashService.openSession(valorAbertura, userAbertura)
      this.movements = []
      this.notify()
      return this.currentSession
    } catch (error) {
      this.error = error.message || 'Erro ao abrir caixa'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Fechar caixa
  async closeSession(valorFechamentoContado, userFechamento) {
    this.loading = true
    this.error = null

    try {
      if (!this.currentSession?.id) {
        throw new Error('Nenhuma sessão aberta')
      }

      const validation = validateCloseSession({ valorFechamentoContado, userFechamento })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const result = await CashService.closeSession(this.currentSession.id, valorFechamentoContado, userFechamento)
      this.currentSession = result.sessao
      this.notify()
      return result
    } catch (error) {
      this.error = error.message || 'Erro ao fechar caixa'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Adicionar movimentação genérica
  async addMovement(tipo, categoria, valor, descricao, userId, orderHistoryId = null) {
    this.loading = true
    this.error = null

    try {
      const validation = validateMovement({ tipo, categoria, valor, userId })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const movement = await CashService.addMovement(tipo, categoria, valor, descricao, userId, orderHistoryId)
      this.movements.push(movement)
      this.notify()
      return movement
    } catch (error) {
      this.error = error.message || 'Erro ao adicionar movimentação'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Atalhos para tipos específicos de movimentação
  async registrarVenda(valor, descricao, userId, orderHistoryId) {
    return this.addMovement('ENTRADA', 'VENDA', valor, descricao, userId, orderHistoryId)
  }

  async registrarSinal(valor, descricao, userId) {
    return this.addMovement('ENTRADA', 'SINAL', valor, descricao, userId)
  }

  async registrarDespesa(valor, descricao, userId) {
    return this.addMovement('SAIDA', 'DESPESA', valor, descricao, userId)
  }

  async registrarSangria(valor, descricao, userId) {
    return this.addMovement('SAIDA', 'SANGRIA', valor, descricao, userId)
  }

  async registrarReforco(valor, descricao, userId) {
    return this.addMovement('ENTRADA', 'REFORCO', valor, descricao, userId)
  }

  // Verificar se caixa está aberto
  isCashOpen() {
    return this.currentSession?.status === 'ABERTO'
  }

  clearError() {
    this.error = null
    this.notify()
  }
}

export default new CashController()
