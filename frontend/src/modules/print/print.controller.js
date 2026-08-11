// Print Controller - Lógica de impressão
import PrintService from '../print/print.service.js'
import { validatePrintOrder } from '../print/print.dto.js'

export class PrintController {
  constructor() {
    this.loading = false
    this.error = null
    this.success = false
    this.observers = []
  }

  subscribe(callback) {
    this.observers.push(callback)
  }

  notify() {
    this.observers.forEach(callback => callback())
  }

  // Imprimir recibo de pedido
  async printOrderReceipt(orderId) {
    this.loading = true
    this.error = null
    this.success = false

    try {
      const validation = validatePrintOrder({ orderId })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const result = await PrintService.printOrderReceipt(orderId)
      this.success = true
      this.notify()
      return result
    } catch (error) {
      // Diferencia erros de impressora não conectada de outros erros
      if (error.status === 503) {
        this.error = 'Impressora térmica não está conectada'
      } else {
        this.error = error.message || 'Erro ao imprimir pedido'
      }
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  clearError() {
    this.error = null
    this.success = false
    this.notify()
  }
}

export default new PrintController()
