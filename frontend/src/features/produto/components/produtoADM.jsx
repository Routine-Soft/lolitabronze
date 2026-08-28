import { useProdutos } from "../produto.hooks";
import { useState } from "react";
import "./produtoADM.css";

const DIAS_SEMANA = [
  { valor: 0, label: 'Domingo' },
  { valor: 1, label: 'Segunda' },
  { valor: 2, label: 'Terça' },
  { valor: 3, label: 'Quarta' },
  { valor: 4, label: 'Quinta' },
  { valor: 5, label: 'Sexta' },
  { valor: 6, label: 'Sábado' },
];

export default function ProdutoADM() {
  const {
    produtos,
    loading,
    error,
    successMessage,
    search,
    addProduto,
    editProduto,
    removeProduto,
    updateSearch,
  } = useProdutos(5);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceNormal, setPriceNormal] = useState('');
  const [pricePromotional, setPricePromotional] = useState('');
  const [diasPromocionais, setDiasPromocionais] = useState([]);
  const [quantity, setQuantity] = useState('');

  function resetForm() {
    setName('');
    setDescription('');
    setPriceNormal('');
    setPricePromotional('');
    setDiasPromocionais([]);
    setQuantity('');
    setEditingId(null);
  }

  function toggleDia(valor) {
    setDiasPromocionais((prev) =>
      prev.includes(valor) ? prev.filter((d) => d !== valor) : [...prev, valor]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const produtoData = {
      name,
      description,
      priceNormal: Number(priceNormal),
      pricePromotional: Number(pricePromotional),
      diasPromocionais,
      quantity: quantity === '' ? null : Number(quantity),
    };

    if (editingId) {
      editProduto(editingId, produtoData);
    } else {
      addProduto(produtoData);
    }

    resetForm();
  }

  function startEditing(produto) {
    setEditingId(produto.id);
    setName(produto.name);
    setDescription(produto.description ?? '');
    setPriceNormal(produto.priceNormal);
    setPricePromotional(produto.pricePromotional);
    setDiasPromocionais(produto.diasPromocionais ?? []);
    setQuantity(produto.quantity ?? '');
  }

  function handleClearSearch() {
    updateSearch('');
  }

  // if (loading) return <p>Carregando produtos...</p>;
  if (error) return <p>Erro: {error.message}</p>;

return (
    <div className="product-page">
      <header className="product-page-header">
        <h2>Gestão de Produtos</h2>
      </header>

      {successMessage && <p className="product-alert-success">{successMessage}</p>}

      {/* ====== LAYOUT DE 2 COLUNAS ====== */}
      <div className="product-grid">
        
        {/* COLUNA 1: FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
        <section className="product-section">
          <h3>{editingId ? "Editar Produto" : "Criar Produto"}</h3>
          
          <form onSubmit={handleSubmit} className="product-form">
            <input
              type="text"
              className="product-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
            />
            
            <input
              type="text"
              className="product-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
            />

            <div className="product-input-row">
              <input
                type="number"
                step="0.01"
                className="product-input"
                value={priceNormal}
                onChange={(e) => setPriceNormal(e.target.value)}
                placeholder="Preço normal (R$)"
              />
              <input
                type="number"
                step="0.01"
                className="product-input"
                value={pricePromotional}
                onChange={(e) => setPricePromotional(e.target.value)}
                placeholder="Preço promo (R$)"
              />
            </div>

            <input
              type="number"
              className="product-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantidade em estoque"
            />

            <div className="product-days-container">
              <p className="product-days-title">Dias em promoção:</p>
              <div className="product-days-grid">
                {DIAS_SEMANA.map((dia) => (
                  <label key={dia.valor} className="product-checkbox-label">
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

            <div className="product-form-actions">
              <button type="submit" className="product-btn-primary product-btn-full">
                {editingId ? "Salvar edição" : "Criar produto"}
              </button>
              {editingId && (
                <button type="button" className="product-btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* COLUNA 2: BUSCA E LISTAGEM */}
        <section className="product-section">
          <h3>Lista de Produtos</h3>

          <div className="product-search-box">
            <input
              type="text"
              className="product-input"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
            />
            <button 
              type="button" 
              className="product-btn-secondary" 
              onClick={handleClearSearch}
            >
              Limpar
            </button>
          </div>

          {loading && <p className="product-loading">Carregando produtos...</p>}

          <ul className="product-scroll-list">
            {produtos.map((produto) => (
              <li key={produto.id} className="product-item">
                <div className="product-item-info">
                  <div className="product-item-header">
                    <strong className="product-item-title">{produto.name}</strong>
                    <span className="product-badge-today">Hoje: R$ {produto.price}</span>
                  </div>

                  {produto.description && (
                    <p className="product-item-desc">{produto.description}</p>
                  )}

                  <div className="product-prices-row">
                    <span>Normal: <strong className="txt-muted">R$ {produto.priceNormal}</strong></span>
                    <span>Promo: <strong className="txt-gold">R$ {produto.pricePromotional}</strong></span>
                  </div>

                  <div className="product-stock-tag">
                    Estoque: <strong>{produto.quantity ?? 'não controlado'}</strong>
                  </div>

                  <p className="product-item-meta">
                    <strong>Dias promo:</strong>{' '}
                    {produto.diasPromocionais
                      .map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.label)
                      .join(', ') || 'nenhum'}
                  </p>
                </div>

                <div className="product-item-actions">
                  <button 
                    type="button" 
                    className="product-btn-edit" 
                    onClick={() => startEditing(produto)}
                  >
                    Editar
                  </button>
                  <button 
                    type="button" 
                    className="product-btn-delete" 
                    onClick={() => removeProduto(produto.id)}
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