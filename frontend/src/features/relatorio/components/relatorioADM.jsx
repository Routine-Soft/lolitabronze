import { useState } from "react";
import { useRelatorio } from "../relatorio.hooks";
import "./relatorioADM.css";

function calcularPeriodo(tipo) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();

  if (tipo === 'dia') {
    const inicio = new Date(ano, mes, dia);
    const fim = new Date(ano, mes, dia + 1);
    return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
  }
  if (tipo === 'mes') {
    const inicio = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 1);
    return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
  }
  // ano
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default function RelatorioADM() {
  const { caixa, faturamento, loading, error, buscarRelatorio } = useRelatorio();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  function handlePeriodoRapido(tipo) {
    const periodo = calcularPeriodo(tipo);
    setInicio(periodo.inicio);
    setFim(periodo.fim);
    buscarRelatorio(periodo.inicio, periodo.fim);
  }

  function handleSubmit(e) {
    e.preventDefault();
    buscarRelatorio(inicio, fim);
  }

return (
    <div className="report-page">
      <header className="report-page-header">
        <h2>Relatório de Caixa e Faturamento</h2>
      </header>

      {/* ====== FILTROS DE PERÍODO ====== */}
      <section className="report-filter-section">
        <div className="report-quick-filters">
          <button 
            type="button" 
            className="report-btn-quick" 
            onClick={() => handlePeriodoRapido('dia')}
          >
            Hoje
          </button>
          <button 
            type="button" 
            className="report-btn-quick" 
            onClick={() => handlePeriodoRapido('mes')}
          >
            Este mês
          </button>
          <button 
            type="button" 
            className="report-btn-quick" 
            onClick={() => handlePeriodoRapido('ano')}
          >
            Este ano
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-custom-filter-form">
          <div className="report-date-inputs">
            <input 
              type="date" 
              className="report-input-date" 
              value={inicio} 
              onChange={(e) => setInicio(e.target.value)} 
            />
            <span className="report-date-separator">até</span>
            <input 
              type="date" 
              className="report-input-date" 
              value={fim} 
              onChange={(e) => setFim(e.target.value)} 
            />
          </div>
          <button type="submit" className="report-btn-primary">
            Buscar período customizado
          </button>
        </form>
      </section>

      {loading && <p className="report-loading">Carregando dados do relatório...</p>}
      {error && <p className="report-alert-error">Erro: {error.message}</p>}

      {/* ====== DASHBOARD DE RESULTADOS ====== */}
      <div className="report-grid">
        
        {/* BLOCO 1: CAIXA */}
        {caixa && (
          <section className="report-section">
            <div className="report-section-header">
              <h3>Caixa</h3>
              <span className="report-badge-count">{caixa.quantidadeMovimentos} movimentações</span>
            </div>

            {/* Cards KPI de Caixa */}
            <div className="report-kpi-grid">
              <div className="report-kpi-card">
                <small>Total Entradas</small>
                <strong className="txt-success">R$ {caixa.totalEntradas}</strong>
              </div>
              <div className="report-kpi-card">
                <small>Total Saídas</small>
                <strong className="txt-danger">R$ {caixa.totalSaidas}</strong>
              </div>
              <div className="report-kpi-card full">
                <small>Saldo Final</small>
                <strong className={caixa.saldo < 0 ? 'txt-danger' : 'txt-gold'}>
                  R$ {caixa.saldo}
                </strong>
              </div>
            </div>

            {/* Detalhamento por Categoria */}
            <div className="report-detail-box">
              <span className="report-detail-title">Por Categoria:</span>
              <ul className="report-list">
                {Object.entries(caixa.porCategoria).map(([cat, valor]) => (
                  <li key={cat} className="report-list-item">
                    <span>{cat}</span>
                    <strong>R$ {valor}</strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detalhamento por Pagamento */}
            <div className="report-detail-box">
              <span className="report-detail-title">Por Forma de Pagamento:</span>
              <ul className="report-list">
                <li className="report-list-item">
                  <span>Pix</span>
                  <strong>R$ {caixa.porTypePayment.pix}</strong>
                </li>
                <li className="report-list-item">
                  <span>Dinheiro</span>
                  <strong>R$ {caixa.porTypePayment.dinheiro}</strong>
                </li>
                <li className="report-list-item">
                  <span>Cartão</span>
                  <strong>R$ {caixa.porTypePayment.cartao}</strong>
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* BLOCO 2: FATURAMENTO */}
        {faturamento && (
          <section className="report-section">
            <div className="report-section-header">
              <h3>Faturamento</h3>
              <span className="report-badge-count">{faturamento.quantidadePedidos} pedidos</span>
            </div>

            {/* Cards KPI de Faturamento */}
            <div className="report-kpi-grid">
              <div className="report-kpi-card full">
                <small>Total Faturado</small>
                <strong className="txt-gold">R$ {faturamento.totalFaturado}</strong>
              </div>
              <div className="report-kpi-card">
                <small>Produtos</small>
                <strong>R$ {faturamento.totalProdutos}</strong>
              </div>
              <div className="report-kpi-card">
                <small>Serviços</small>
                <strong>R$ {faturamento.totalServicos}</strong>
              </div>
            </div>

            {/* Detalhamento por Pagamento */}
            <div className="report-detail-box">
              <span className="report-detail-title">Por Forma de Pagamento:</span>
              <ul className="report-list">
                <li className="report-list-item">
                  <span>Pix</span>
                  <strong>R$ {faturamento.porTypePayment.pix}</strong>
                </li>
                <li className="report-list-item">
                  <span>Dinheiro</span>
                  <strong>R$ {faturamento.porTypePayment.dinheiro}</strong>
                </li>
                <li className="report-list-item">
                  <span>Cartão</span>
                  <strong>R$ {faturamento.porTypePayment.cartao}</strong>
                </li>
              </ul>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}