import { useState } from "react";
import { useRankingVendas } from "../relatorio.hooks";

import "./relatorioVendasADM.css";

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
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default function RelatorioVendasADM() {
  const { produtos, servicos, clientes, loading, error, buscarRanking } = useRankingVendas();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  function handlePeriodoRapido(tipo) {
    const periodo = calcularPeriodo(tipo);
    setInicio(periodo.inicio);
    setFim(periodo.fim);
    buscarRanking(periodo.inicio, periodo.fim);
  }

  function handleSubmit(e) {
    e.preventDefault();
    buscarRanking(inicio, fim);
  }

return (
    <div className="sales-report-page">
      <header className="sales-report-header">
        <h2>Ranking de Vendas</h2>
      </header>

      {/* ====== FILTROS DE PERÍODO ====== */}
      <section className="sales-report-filter-section">
        <div className="sales-report-quick-filters">
          <button 
            type="button" 
            className="sales-report-btn-quick" 
            onClick={() => handlePeriodoRapido('dia')}
          >
            Hoje
          </button>
          <button 
            type="button" 
            className="sales-report-btn-quick" 
            onClick={() => handlePeriodoRapido('mes')}
          >
            Este mês
          </button>
          <button 
            type="button" 
            className="sales-report-btn-quick" 
            onClick={() => handlePeriodoRapido('ano')}
          >
            Este ano
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sales-report-custom-filter-form">
          <div className="sales-report-date-inputs">
            <input 
              type="date" 
              className="sales-report-input-date" 
              value={inicio} 
              onChange={(e) => setInicio(e.target.value)} 
            />
            <span className="sales-report-date-separator">até</span>
            <input 
              type="date" 
              className="sales-report-input-date" 
              value={fim} 
              onChange={(e) => setFim(e.target.value)} 
            />
          </div>
          <button type="submit" className="sales-report-btn-primary">
            Buscar período customizado
          </button>
        </form>
      </section>

      {loading && <p className="sales-report-loading">Carregando ranking de vendas...</p>}
      {error && <p className="sales-report-alert-error">Erro: {error.message}</p>}

      {/* ====== RANKINGS EM 2 COLUNAS ====== */}
      <div className="sales-report-grid">
        
        {/* RANKING DE PRODUTOS */}
        <section className="sales-report-section">
          <div className="sales-report-section-header">
            <h3>Produtos mais vendidos</h3>
          </div>

          {produtos.length === 0 && !loading ? (
            <p className="sales-report-empty">Nenhuma venda no período</p>
          ) : (
            <ol className="sales-report-list">
              {produtos.map((p, index) => (
                <li key={p.id} className="sales-report-item">
                  <div className="sales-report-rank-badge">#{index + 1}</div>
                  <div className="sales-report-item-info">
                    <strong className="sales-report-item-title">{p.name}</strong>
                    <span className="sales-report-item-sub">
                      {p.quantidade} unidades vendidas
                    </span>
                  </div>
                  <div className="sales-report-item-val">
                    R$ {p.valor}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* RANKING DE SERVIÇOS */}
        <section className="sales-report-section">
          <div className="sales-report-section-header">
            <h3>Serviços mais vendidos</h3>
          </div>

          {servicos.length === 0 && !loading ? (
            <p className="sales-report-empty">Nenhuma venda no período</p>
          ) : (
            <ol className="sales-report-list">
              {servicos.map((s, index) => (
                <li key={s.id} className="sales-report-item">
                  <div className="sales-report-rank-badge">#{index + 1}</div>
                  <div className="sales-report-item-info">
                    <strong className="sales-report-item-title">{s.name}</strong>
                    <span className="sales-report-item-sub">
                      {s.quantidade} atendimentos
                    </span>
                  </div>
                  <div className="sales-report-item-val">
                    R$ {s.valor}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* RANKING DE CLIENTES */}
        <section className="sales-report-section">
          <div className="sales-report-section-header">
            <h3>Clientes que mais compram</h3>
          </div>

          {clientes.length === 0 && !loading ? (
            <p className="sales-report-empty">Nenhuma venda no período</p>
          ) : (
            <ol className="sales-report-list">
              {clientes.map((c, index) => (
                <li key={c.id} className="sales-report-item">
                  <div className="sales-report-rank-badge">#{index + 1}</div>
                  <div className="sales-report-item-info">
                    <strong className="sales-report-item-title">{c.name}</strong>
                    <span className="sales-report-item-sub">
                      {c.quantidade} pedido{c.quantidade > 1 ? 's' : ''} — {c.phone}
                    </span>
                  </div>
                  <div className="sales-report-item-val">
                    R$ {c.valor}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

      </div>
    </div>
  );
}