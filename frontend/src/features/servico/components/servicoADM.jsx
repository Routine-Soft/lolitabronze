import { useServicos } from "../servico.hooks";
import { useState } from "react";
import './servicoADM.css'

const DIAS_SEMANA = [
  { valor: 0, label: 'Domingo' },
  { valor: 1, label: 'Segunda' },
  { valor: 2, label: 'Terça' },
  { valor: 3, label: 'Quarta' },
  { valor: 4, label: 'Quinta' },
  { valor: 5, label: 'Sexta' },
  { valor: 6, label: 'Sábado' },
];

export default function ServicoADM() {
  const {
    servicos,
    loading,
    error,
    successMessage,
    search,
    addServico,
    editServico,
    removeServico,
    updateSearch,
  } = useServicos(5);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceNormal, setPriceNormal] = useState('');
  const [pricePromotional, setPricePromotional] = useState('');
  const [diasPromocionais, setDiasPromocionais] = useState([]);

  function resetForm() {
    setName('');
    setDescription('');
    setPriceNormal('');
    setPricePromotional('');
    setDiasPromocionais([]);
    setEditingId(null);
  }

  function toggleDia(valor) {
    setDiasPromocionais((prev) =>
      prev.includes(valor) ? prev.filter((d) => d !== valor) : [...prev, valor]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const servicoData = {
      name,
      description,
      priceNormal: Number(priceNormal),
      pricePromotional: Number(pricePromotional),
      diasPromocionais,
    };

    if (editingId) {
      editServico(editingId, servicoData);
    } else {
      addServico(servicoData);
    }

    resetForm();
  }

  function startEditing(servico) {
    setEditingId(servico.id);
    setName(servico.name);
    setDescription(servico.description ?? '');
    setPriceNormal(servico.priceNormal);
    setPricePromotional(servico.pricePromotional);
    setDiasPromocionais(servico.diasPromocionais ?? []);
  }

  function handleClearSearch() {
    updateSearch('');
  }

  // if (loading) return <p>Carregando serviços...</p>;
  if (error) return <p>Erro: {error.message}</p>;

return (
    <div className="service-page">
      <header className="service-page-header">
        <h2>Gestão de Serviços</h2>
      </header>

      {successMessage && <p className="service-alert-success">{successMessage}</p>}

      {/* ====== LAYOUT DE 2 COLUNAS ====== */}
      <div className="service-grid">
        
        {/* COLUNA 1: FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
        <section className="service-section">
          <h3>{editingId ? "Editar Serviço" : "Criar Serviço"}</h3>
          
          <form onSubmit={handleSubmit} className="service-form">
            <input
              type="text"
              className="service-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do serviço"
            />
            
            <input
              type="text"
              className="service-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
            />

            <div className="service-input-row">
              <input
                type="number"
                step="0.01"
                className="service-input"
                value={priceNormal}
                onChange={(e) => setPriceNormal(e.target.value)}
                placeholder="Preço normal (R$)"
              />
              <input
                type="number"
                step="0.01"
                className="service-input"
                value={pricePromotional}
                onChange={(e) => setPricePromotional(e.target.value)}
                placeholder="Preço promo (R$)"
              />
            </div>

            <div className="service-days-container">
              <p className="service-days-title">Dias em promoção:</p>
              <div className="service-days-grid">
                {DIAS_SEMANA.map((dia) => (
                  <label key={dia.valor} className="service-checkbox-label">
                    <input
                      type="checkbox"
                      checked={diasPromocionais.includes(dia.valor)}
                      onChange={() => toggleDia(dia.valor)}
                    />
                    <span>{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="service-form-actions">
              <button type="submit" className="service-btn-primary service-btn-full">
                {editingId ? "Salvar edição" : "Criar serviço"}
              </button>
              {editingId && (
                <button type="button" className="service-btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* COLUNA 2: BUSCA E LISTAGEM */}
        <section className="service-section">
          <h3>Lista de Serviços</h3>

          <div className="service-search-box">
            <input
              type="text"
              className="service-input"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Buscar serviços..."
            />
            <button 
              type="button" 
              className="service-btn-secondary" 
              onClick={handleClearSearch}
            >
              Limpar
            </button>
          </div>

          {loading && <p className="service-loading">Carregando serviços...</p>}

          <ul className="service-scroll-list">
            {servicos.map((servico) => (
              <li key={servico.id} className="service-item">
                <div className="service-item-info">
                  <div className="service-item-header">
                    <strong className="service-item-title">{servico.name}</strong>
                    <span className="service-badge-today">Hoje: R$ {servico.price}</span>
                  </div>

                  {servico.description && (
                    <p className="service-item-desc">{servico.description}</p>
                  )}

                  <div className="service-prices-row">
                    <span>Normal: <strong className="txt-muted">R$ {servico.priceNormal}</strong></span>
                    <span>Promo: <strong className="txt-gold">R$ {servico.pricePromotional}</strong></span>
                  </div>

                  <p className="service-item-meta">
                    <strong>Dias promo:</strong>{' '}
                    {servico.diasPromocionais
                      .map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.label)
                      .join(', ') || 'Nenhum'}
                  </p>
                </div>

                <div className="service-item-actions">
                  <button 
                    type="button" 
                    className="service-btn-edit" 
                    onClick={() => startEditing(servico)}
                  >
                    Editar
                  </button>
                  <button 
                    type="button" 
                    className="service-btn-delete" 
                    onClick={() => removeServico(servico.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
}