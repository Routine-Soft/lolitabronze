import { useCash } from "../cash.hooks";
import { useState } from "react";

const CATEGORIAS = ['VENDA', 'SINAL', 'COMPLEMENTO', 'DESPESA', 'SANGRIA', 'REFORCO', 'OUTRO'];

export default function CashADM() {
  const {
    currentSession,
    sessions,
    movements,
    loading,
    error,
    successMessage,
    openCashSession,
    closeCashSession,
    removeSession,
    addCashMovement,
    addCashDespesa,
    editMovement,
    removeMovement,
    refreshMovements,
  } = useCash();

  // ====== estado: abrir/fechar caixa ======
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamentoContado, setValorFechamentoContado] = useState('');

  // ====== estado: nova movimentação manual ======
  const [tipo, setTipo] = useState('ENTRADA');
  const [categoria, setCategoria] = useState('OUTRO');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [typePayment, setTypePayment] = useState('pix');

  // ====== estado: nova despesa ======
  const [valorDespesa, setValorDespesa] = useState('');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [typePaymentDespesa, setTypePaymentDespesa] = useState('dinheiro');

  // ====== estado: edição de movimentação ======
  const [editingId, setEditingId] = useState(null);
  const [editValor, setEditValor] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  // ====== estado: filtro ======
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

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

  function startEditingMovement(movement) {
    setEditingId(movement.id);
    setEditValor(movement.valor);
    setEditDescricao(movement.descricao ?? '');
  }

  function handleEditMovement(e) {
    e.preventDefault();
    editMovement(editingId, { valor: Number(editValor), descricao: editDescricao });
    setEditingId(null);
    setEditValor('');
    setEditDescricao('');
  }

  function handleFilter(e) {
    e.preventDefault();
    const filtros = {};
    if (filtroTipo) filtros.tipo = filtroTipo;
    if (filtroCategoria) filtros.categoria = filtroCategoria;
    refreshMovements(filtros);
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

return (
    <div className="cash-page">
      <header className="cash-page-header">
        <h2>Caixa</h2>
      </header>

      {successMessage && <p className="cash-alert-success">{successMessage}</p>}

      {/* ====== BLOCO SUPERIOR: 3 COLUNAS EM LINHA ====== */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "1.25rem", 
          width: "100%",
          alignItems: "start",
          marginBottom: "1.25rem"
        }}
      >
        {/* 1. SESSÃO ATUAL */}
        <section className="cash-section">
          <h3>Sessão atual</h3>
          {currentSession ? (
            <div className="cash-session-info">
              <div className="cash-badge-status">
                Status: <span className="status-open">{currentSession.status}</span>
              </div>
              <p className="cash-info-item">
                <span>Aberto em:</span> {new Date(currentSession.dataAbertura).toLocaleString("pt-BR")}
              </p>
              <p className="cash-info-item">
                <span>Valor de abertura:</span> R$ {currentSession.valorAbertura}
              </p>

              {currentSession.resumo && (
                <div className="cash-summary-grid">
                  <div className="summary-card">
                    <small>Entradas</small>
                    <strong className="txt-success">R$ {currentSession.resumo.totalEntradas}</strong>
                  </div>
                  <div className="summary-card">
                    <small>Saídas</small>
                    <strong className="txt-danger">R$ {currentSession.resumo.totalSaidas}</strong>
                  </div>
                  <div className="summary-card full">
                    <small>Lucro Líquido</small>
                    <strong className="txt-gold">R$ {currentSession.resumo.lucro}</strong>
                  </div>
                </div>
              )}

              <form onSubmit={handleCloseSession} className="cash-form">
                <input
                  type="number"
                  step="0.01"
                  className="cash-input"
                  value={valorFechamentoContado}
                  onChange={(e) => setValorFechamentoContado(e.target.value)}
                  placeholder="Valor contado no fechamento"
                />
                <button type="submit" className="cash-btn-primary cash-btn-full">
                  Fechar caixa
                </button>
              </form>
            </div>
          ) : (
            <div className="cash-empty-session">
              <p className="cash-loading">Nenhum caixa aberto.</p>
              <form onSubmit={handleOpenSession} className="cash-form">
                <input
                  type="number"
                  step="0.01"
                  className="cash-input"
                  value={valorAbertura}
                  onChange={(e) => setValorAbertura(e.target.value)}
                  placeholder="Valor de abertura"
                />
                <button type="submit" className="cash-btn-primary cash-btn-full">
                  Abrir caixa
                </button>
              </form>
            </div>
          )}
        </section>

        {/* 2. REGISTRAR DESPESA */}
        <section className="cash-section">
          <h3>Registrar despesa</h3>
          <form onSubmit={handleAddDespesa} className="cash-form">
            <input
              type="number"
              step="0.01"
              className="cash-input"
              value={valorDespesa}
              onChange={(e) => setValorDespesa(e.target.value)}
              placeholder="Valor"
            />
            <input
              type="text"
              className="cash-input"
              value={descricaoDespesa}
              onChange={(e) => setDescricaoDespesa(e.target.value)}
              placeholder="Descrição (ex: conta de luz)"
            />
            <select
              className="cash-select"
              value={typePaymentDespesa}
              onChange={(e) => setTypePaymentDespesa(e.target.value)}
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
            </select>
            <button type="submit" className="cash-btn-primary cash-btn-full">
              Pagar despesa
            </button>
          </form>
        </section>

        {/* 3. MOVIMENTAÇÃO MANUAL */}
        <section className="cash-section">
          <h3>Movimentação manual</h3>
          <form onSubmit={handleAddMovement} className="cash-form">
            <div className="cash-input-row">
              <select className="cash-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
              <select className="cash-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <input
              type="number"
              step="0.01"
              className="cash-input"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Valor"
            />
            <input
              type="text"
              className="cash-input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição"
            />
            <select className="cash-select" value={typePayment} onChange={(e) => setTypePayment(e.target.value)}>
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
            </select>
            <button type="submit" className="cash-btn-primary cash-btn-full">
              Lançar movimentação
            </button>
          </form>
        </section>
      </div>

      {/* ====== BLOCO INFERIOR: 2 COLUNAS EM LINHA ====== */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
          gap: "1.25rem", 
          width: "100%",
          alignItems: "start"
        }}
      >
        {/* 1. LISTA DE MOVIMENTAÇÕES */}
        <section className="cash-section">
          <h3>Movimentações</h3>
          <form onSubmit={handleFilter} className="cash-form">
            <div className="cash-input-row">
              <select className="cash-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos os tipos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
              <select className="cash-select" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas categorias</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="cash-modal-actions">
              <button type="submit" className="cash-btn-primary">Filtrar</button>
              <button
                type="button"
                className="cash-btn-primary"
                onClick={() => { setFiltroTipo(''); setFiltroCategoria(''); refreshMovements(); }}
              >
                Limpar
              </button>
            </div>
          </form>

          <ul className="cash-scroll-list">
            {movements.map((movement) => (
              <li key={movement.id} className="cash-item">
                <div className="cash-item-info">
                  <div className="cash-item-header">
                    <span className={movement.tipo === 'ENTRADA' ? 'tag-entrada' : 'tag-saida'}>
                      {movement.tipo}
                    </span>
                    <span className="cash-item-cat">{movement.categoria}</span>
                  </div>
                  <strong className="cash-item-val">R$ {movement.valor}</strong>
                  <p className="cash-item-desc">{movement.descricao}</p>
                  <small className="cash-item-meta">
                    {movement.typePayment ?? '—'} • {movement.userId?.name} • {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                  </small>
                </div>
                <div className="cash-item-actions">
                  <button className="cash-btn-primary" onClick={() => startEditingMovement(movement)}>Edit</button>
                  <button className="cash-btn-primary" onClick={() => removeMovement(movement.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. HISTÓRICO DE SESSÕES */}
        <section className="cash-section">
          <h3>Histórico de caixas</h3>
          <ul className="cash-scroll-list">
            {sessions.map((session) => (
              <li key={session.id} className="cash-item flex-col">
                <div className="cash-session-history-info">
                  <span className="cash-badge-status">{session.status}</span>
                  <p className="cash-info-item"><span>Abertura:</span> {new Date(session.dataAbertura).toLocaleDateString('pt-BR')} — R$ {session.valorAbertura}</p>
                  {session.dataFechamento && (
                    <>
                      <p className="cash-info-item"><span>Fechamento:</span> {new Date(session.dataFechamento).toLocaleDateString('pt-BR')}</p>
                      <p className="cash-info-item"><span>Contado:</span> R$ {session.valorFechamentoContado}</p>
                      <p className="cash-info-item"><span>Esperado:</span> R$ {session.valorFechamentoEsperado}</p>
                      <p className="cash-info-item"><span>Diferença:</span> <strong className={session.diferenca < 0 ? 'txt-danger' : 'txt-success'}>R$ {session.diferenca}</strong></p>
                    </>
                  )}
                </div>
                {session.status === 'FECHADO' && (
                  <button className="cash-btn-primary cash-btn-full mt-2" onClick={() => removeSession(session.id)}>
                    Excluir Histórico
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ====== MODAL DE EDIÇÃO ====== */}
      {editingId && (
        <div className="cash-modal-overlay">
          <div className="cash-modal">
            <h3>Editando movimentação</h3>
            <form onSubmit={handleEditMovement} className="cash-form">
              <input
                type="number"
                step="0.01"
                className="cash-input"
                value={editValor}
                onChange={(e) => setEditValor(e.target.value)}
                placeholder="Valor"
              />
              <input
                type="text"
                className="cash-input"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                placeholder="Descrição"
              />
              <div className="cash-modal-actions">
                <button type="submit" className="cash-btn-primary">Salvar</button>
                <button type="button" className="cash-btn-secondary" onClick={() => setEditingId(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}