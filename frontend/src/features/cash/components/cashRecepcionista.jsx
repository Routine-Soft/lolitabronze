import { useCash } from "../cash.hooks";
import { useState } from "react";
import "./cashRecepcionista.css";

const CATEGORIAS = ['VENDA', 'SINAL', 'COMPLEMENTO', 'DESPESA', 'SANGRIA', 'REFORCO', 'OUTRO'];

// function isHoje(dataString) {
//   const data = new Date(dataString);
//   const hoje = new Date();
//   return (
//     data.getFullYear() === hoje.getFullYear() &&
//     data.getMonth() === hoje.getMonth() &&
//     data.getDate() === hoje.getDate()
//   );
// }

export default function CashRecepcionista() {
  const {
    currentSession,
    // movements,
    loading,
    error,
    successMessage,
    openCashSession,
    closeCashSession,
    addCashMovement,
    addCashDespesa,
  } = useCash();

  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamentoContado, setValorFechamentoContado] = useState('');

  const [tipo, setTipo] = useState('ENTRADA');
  const [categoria, setCategoria] = useState('OUTRO');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [typePayment, setTypePayment] = useState('pix');

  const [valorDespesa, setValorDespesa] = useState('');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [typePaymentDespesa, setTypePaymentDespesa] = useState('dinheiro');

  // só movimentações de hoje — recepcionista não vê histórico de dias anteriores
  // const movimentosHoje = movements.filter((m) => isHoje(m.createdAt));

  function handleOpenSession(e) {
    e.preventDefault();
    openCashSession(Number(valorAbertura));
    setValorAbertura('');
  }

  function handleCloseSession(e) {
    e.preventDefault();
    if (!currentSession) return;
    closeCashSession(currentSession.id, Number(valorFechamentoContado));
    setValorFechamentoContado('');
  }

  function handleAddMovement(e) {
    e.preventDefault();
    addCashMovement({ tipo, categoria, valor: Number(valor), descricao, typePayment });
    setValor('');
    setDescricao('');
  }

  function handleAddDespesa(e) {
    e.preventDefault();
    addCashDespesa({
      valor: Number(valorDespesa),
      descricao: descricaoDespesa,
      typePayment: typePaymentDespesa,
    });
    setValorDespesa('');
    setDescricaoDespesa('');
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

return (
    <div className="cash-card">
      <div className="cash-header">
        <h2>Caixa</h2>
      </div>

      {successMessage && (
        <p className="cash-alert-success">
          {successMessage}
        </p>
      )}

      <div className="cash-sections-container">
        {/* ====== SESSÃO ATUAL ====== */}
        <div className="cash-section">
          <h3>Caixa de hoje</h3>

          {currentSession ? (
            <div className="cash-session">
              <div className="cash-info">
                <div className="cash-info-item">
                  <span className="cash-info-label">Status</span>
                  <span className="cash-badge-status">{currentSession.status}</span>
                </div>

                <div className="cash-info-item">
                  <span className="cash-info-label">Aberto em</span>
                  <span className="cash-info-val">
                    {new Date(currentSession.dataAbertura).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="cash-info-item">
                  <span className="cash-info-label">Abertura</span>
                  <span className="cash-info-val">R$ {currentSession.valorAbertura}</span>
                </div>

                <div className="cash-info-item">
                  <span className="cash-info-label">Fechamento</span>
                  <span className="cash-info-val">R$ {currentSession.valorFechamento}</span>
                </div>
              </div>

              {currentSession.resumo && (
                <div className="cash-summary">
                  <div className="cash-summary-item cash-summary-entry">
                    <span>Entradas</span>
                    <strong>R$ {currentSession.resumo.totalEntradas}</strong>
                  </div>

                  <div className="cash-summary-item cash-summary-exit">
                    <span>Saídas</span>
                    <strong>R$ {currentSession.resumo.totalSaidas}</strong>
                  </div>
                </div>
              )}

              <form onSubmit={handleCloseSession} className="cash-form-row">
                <input
                  className="cash-input"
                  type="number"
                  step="0.01"
                  value={valorFechamentoContado}
                  onChange={(e) => setValorFechamentoContado(e.target.value)}
                  placeholder="Valor fechamento"
                />
                <button type="submit" className="cash-btn-danger">
                  Fechar
                </button>
              </form>
            </div>
          ) : (
            <div className="cash-session">
              <p className="cash-empty">Nenhum caixa aberto.</p>

              <form onSubmit={handleOpenSession} className="cash-form-row">
                <input
                  className="cash-input"
                  type="number"
                  step="0.01"
                  value={valorAbertura}
                  onChange={(e) => setValorAbertura(e.target.value)}
                  placeholder="Valor de abertura"
                />

                <button type="submit" className="cash-btn-primary">
                  Abrir caixa
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ====== NOVA DESPESA ====== */}
        <div className="cash-section">
          <h3>Registrar despesa</h3>

          <form onSubmit={handleAddDespesa} className="cash-form">
            <div className="cash-form-grid-2">
              <input
                className="cash-input"
                type="number"
                step="0.01"
                value={valorDespesa}
                onChange={(e) => setValorDespesa(e.target.value)}
                placeholder="Valor"
              />

              <select
                className="cash-input"
                value={typePaymentDespesa}
                onChange={(e) => setTypePaymentDespesa(e.target.value)}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>

            <input
              className="cash-input"
              type="text"
              value={descricaoDespesa}
              onChange={(e) => setDescricaoDespesa(e.target.value)}
              placeholder="Descrição (ex: conta de luz)"
            />

            <button type="submit" className="cash-btn-primary cash-btn-full">
              Pagar despesa
            </button>
          </form>
        </div>

        {/* ====== MOVIMENTAÇÃO MANUAL ====== */}
        <div className="cash-section">
          <h3>Movimentação manual</h3>

          <form onSubmit={handleAddMovement} className="cash-form">
            <div className="cash-form-grid-2">
              <select
                className="cash-input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>

              <select
                className="cash-input"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="cash-form-grid-2">
              <input
                className="cash-input"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Valor"
              />

              <select
                className="cash-input"
                value={typePayment}
                onChange={(e) => setTypePayment(e.target.value)}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>

            <input
              className="cash-input"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição"
            />

            <button type="submit" className="cash-btn-primary cash-btn-full">
              Lançar movimentação
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}