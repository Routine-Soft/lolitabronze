// Print Service - Chamadas à API de impressão
import apiService from '../../services/httpClient.js'

export const PrintService = {
  // Imprimir recibo do pedido - Protegido
  // Requer impressora térmica conectada ao backend
  async printOrderReceipt(orderId) {
    const response = await apiService.post(`/print/order/${orderId}`, {})
    return response.data
  },
}

export default PrintService
