import { useEffect } from "react";
import { useRelatorio } from "../relatorio.hooks";
import './relatorioRecepcionista.css';

function getPeriodoHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();

  const inicio = new Date(ano, mes, dia);
  const fim = new Date(ano, mes, dia + 1);

  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: fim.toISOString().slice(0, 10),
  };
}

export default function RelatorioRecepcionista() {
  const { caixa, loading, error, buscarRelatorio } = useRelatorio();

  useEffect(() => {
    const { inicio, fim } = getPeriodoHoje();
    buscarRelatorio(inicio, fim);
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error.message}</p>;




  return (
    <div className="caixa-card">
      <h2 className="caixa-title">Caixa de hoje</h2>

      {caixa && (
        <div className="caixa-content">
          {/* Cards de resumo */}
          <div className="caixa-summary-grid">
            <div className="caixa-summary-item entradas">
              <span className="caixa-label">Entradas</span>
              <span className="caixa-value-entradas">R$ {caixa.totalEntradas}</span>
            </div>
            <div className="caixa-summary-item saidas">
              <span className="caixa-label">Saídas</span>
              <span className="caixa-value-saidas">R$ {caixa.totalSaidas}</span>
            </div>
            <div className="caixa-summary-item movimentos">
              <span className="caixa-label">Mov.</span>
              <span className="caixa-value-mov">{caixa.quantidadeMovimentos}</span>
            </div>
          </div>

          {/* Saldo em destaque */}
          <div className="caixa-saldo-box">
            <span>Saldo</span>
            <span className="caixa-saldo-val">R$ {caixa.saldo}</span>
          </div>

          {/* Por categoria */}
          <div className="caixa-section">
            <h3 className="caixa-subtitle">Por categoria</h3>
            <ul className="caixa-cat-list">
              {Object.entries(caixa.porCategoria || {}).map(([cat, valor]) => (
                <li key={cat} className="caixa-cat-item">
                  <span className="caixa-cat-name">{cat}</span>
                  <span className="caixa-cat-val">R$ {valor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Por forma de pagamento */}
          <div className="caixa-section">
            <h3 className="caixa-subtitle">Forma de pagamento</h3>
            <div className="caixa-payment-grid">
              <div className="caixa-payment-card">
                <span className="caixa-label">Pix</span>
                <span className="caixa-payment-val">R$ {caixa.porTypePayment?.pix}</span>
              </div>
              <div className="caixa-payment-card">
                <span className="caixa-label">Dinheiro</span>
                <span className="caixa-payment-val">R$ {caixa.porTypePayment?.dinheiro}</span>
              </div>
              <div className="caixa-payment-card">
                <span className="caixa-label">Cartão</span>
                <span className="caixa-payment-val">R$ {caixa.porTypePayment?.cartao}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}