// Helper para imprimir recibos na impressora térmica
// Função assíncrona mas não bloqueia o fluxo principal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export async function printOrder(orderId) {
  const accessToken = localStorage.getItem('accessToken')

  if (!accessToken) {
    console.warn('[Print] Usuário não autenticado')
    return false
  }

  if (!orderId) {
    console.warn('[Print] ID do pedido não fornecido')
    return false
  }

  try {
    const response = await fetch(`${API_URL}/print/order/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.warn(`[Print] Erro ${response.status}: ${error.message}`)
      return false
    }

    console.log('✓ [Print] Recibo enviado para impressora')
    return true
  } catch (err) {
    console.warn('[Print] Falha ao conectar com impressora:', err.message)
    return false
  }
}
