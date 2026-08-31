const target = new EventTarget();
const EVENTO = 'dashboard:refresh';

// chamado por qualquer hook depois de uma mutação (criar, editar, excluir, fechar...)
export function notifyDashboardRefresh() {
  target.dispatchEvent(new Event(EVENTO));
}

// chamado por qualquer hook que precisa se atualizar quando algo mudar em outro lugar
// retorna uma função de "unsubscribe" pra usar no cleanup do useEffect
export function onDashboardRefresh(handler) {
  target.addEventListener(EVENTO, handler);
  return () => target.removeEventListener(EVENTO, handler);
}