// Cash Session Service - Gerenciamento da sessão de caixa
import CashService from './cash.service.js'

export const CashSessionService = {
  // Abrir nova sessão
  open: (valorAbertura, userAbertura) => CashService.openSession(valorAbertura, userAbertura),

  // Fechar sessão
  close: (sessionId, valorFechamentoContado, userFechamento) =>
    CashService.closeSession(sessionId, valorFechamentoContado, userFechamento),

  // Obter sessão atualmente aberta
  getCurrent: () => CashService.getCurrent(),
}

export default CashSessionService

