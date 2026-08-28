import { usePrint } from "../print.hooks";
import { useState } from "react";
import './print.css';

export default function Print() {
  const { loading, error, successMessage, runTestPrint, printOrderReceipt } = usePrint();

  const [textoTeste, setTextoTeste] = useState('');
  const [orderId, setOrderId] = useState('');

  function handleTestPrint(e) {
    e.preventDefault();
    runTestPrint(textoTeste);
  }

  function handlePrintOrder(e) {
    e.preventDefault();
    if (!orderId) return;
    printOrderReceipt(orderId);
  }

return (
    <div className="print-page">
      <header className="print-page-header">
        <h2>Impressão</h2>
      </header>

      {successMessage && <p className="print-alert-success">{successMessage}</p>}
      {error && <p className="print-alert-error">Erro: {error.message}</p>}

      {/* ====== GRID DE FERRAMENTAS DE IMPRESSÃO ====== */}
      <div className="print-grid">
        
        {/* BLOCO 1: TESTAR IMPRESSORA */}
        <section className="print-section">
          <h3>Testar impressora</h3>
          
          <form onSubmit={handleTestPrint} className="print-form">
            <div className="print-input-group">
              <label className="print-label">Texto para teste</label>
              <input
                type="text"
                className="print-input"
                value={textoTeste}
                onChange={(e) => setTextoTeste(e.target.value)}
                placeholder="Texto de teste (opcional)"
              />
            </div>

            <button 
              type="submit" 
              className="print-btn-primary print-btn-full" 
              disabled={loading}
            >
              {loading ? 'Imprimindo...' : 'Testar impressora'}
            </button>
          </form>
        </section>

        {/* BLOCO 2: IMPRIMIR RECIBO */}
        <section className="print-section">
          <h3>Imprimir recibo de pedido</h3>

          <form onSubmit={handlePrintOrder} className="print-form">
            <div className="print-input-group">
              <label className="print-label">Identificador do pedido</label>
              <input
                type="text"
                className="print-input"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Informe o ID do pedido"
              />
            </div>

            <button 
              type="submit" 
              className="print-btn-primary print-btn-full" 
              disabled={loading}
            >
              {loading ? 'Imprimindo...' : 'Imprimir recibo'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}