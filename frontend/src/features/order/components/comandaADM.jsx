import { useState } from "react";
import { useComandas, useComanda } from "../comanda.hooks";
import { useCustomers } from "../../customer/customer.hooks";
import { useProdutos } from "../../produto/produto.hooks";
import { useServicos } from "../../servico/servico.hooks";
import EntityPicker from "../../shared/components/EntityPicker";

export default function ComandaADM() {
  const {
    comandas,
    loading,
    error,
    successMessage,
    filtroStatus,
    setFiltroStatus,
    novaComanda,
  } = useComandas();

  const customersPicker = useCustomers(5);

  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [observacao, setObservacao] = useState('');

  const [comandaSelecionadaId, setComandaSelecionadaId] = useState(null);

  async function handleAbrirComanda(e) {
    e.preventDefault();
    if (!customerId) return;
    const nova = await novaComanda(customerId, observacao);
    setCustomerId('');
    setObservacao('');
    setIsAbrirModalOpen(false);
    if (nova) setComandaSelecionadaId(nova.id);
  }

  if (comandaSelecionadaId) {
    return (
      <ComandaDetalhe
        comandaId={comandaSelecionadaId}
        onVoltar={() => setComandaSelecionadaId(null)}
      />
    );
  }

  if (loading) return <div className="orderadm-card">Carregando comandas...</div>;
  if (error) return <div className="orderadm-card">Erro: {error.message}</div>;

  return (
    <div className="orderadm-card">
      <div className="orderadm-header">
        <h1>🧾 Comandas</h1>
        <button type="button" className="btn-primary" onClick={() => setIsAbrirModalOpen(true)}>
          + Abrir comanda
        </button>
      </div>

      {successMessage && <p className="orderadm-alert-success">{successMessage}</p>}

      <div className="filters-bar">
        <select
          className="form-select"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="ABERTA">Abertas</option>
          <option value="FECHADA">Fechadas</option>
          <option value="CANCELADA">Canceladas</option>
          <option value="">Todas</option>
        </select>
      </div>

      <div className="orders-list">
        {comandas.length === 0 && <p className="orders-list-empty">Nenhuma comanda encontrada.</p>}

        {comandas.map((c) => (
          <div key={c.id} className="orders-list-item" onClick={() => setComandaSelecionadaId(c.id)}>
            <p>
              <span className="order-tag">{c.customerId?.name ?? 'Cliente'}</span>
              {' — '}
              <span className="order-meta">
                {c.itens.length} item(ns) &nbsp;
                <span className={`order-status status-${c.status?.toLowerCase()}`}>{c.status}</span>
                &nbsp;
                <span className={c.totalPendente > 0 ? 'payment-pending' : 'payment-paid'}>
                  {c.totalPendente > 0 ? `Pendente R$ ${c.totalPendente}` : 'PAGO'}
                </span>
              </span>
            </p>
          </div>
        ))}
      </div>

      {isAbrirModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-form">
            <div className="modal-header">
              <h2>Abrir comanda</h2>
              <button type="button" className="btn-close-icon" onClick={() => setIsAbrirModalOpen(false)}>✕</button>
            </div>

            <form id="abrir-comanda-form" onSubmit={handleAbrirComanda} className="modal-body">
              <div className="form-field form-field-bordered">
                <label className="form-label">Cliente</label>
                <div className="entity-picker-wrapper">
                  <EntityPicker
                    items={customersPicker.customers}
                    loading={customersPicker.loading}
                    search={customersPicker.search}
                    onSearchChange={customersPicker.updateSearch}
                    page={customersPicker.page}
                    totalPages={customersPicker.pagination.totalPages}
                    onPageChange={customersPicker.setPage}
                    selectedId={customerId}
                    onSelect={setCustomerId}
                    renderLabel={(c) => `${c.name} — ${c.phone}`}
                    placeholder="Buscar cliente por nome ou telefone"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Observação</label>
                <textarea
                  className="form-textarea"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observação (opcional)"
                />
              </div>
            </form>

            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setIsAbrirModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="abrir-comanda-form" className="btn-primary" disabled={!customerId}>
                Abrir comanda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== TELA DE ATENDIMENTO DE UMA COMANDA ESPECÍFICA ======

function ComandaDetalhe({ comandaId, onVoltar }) {
  const {
    comanda,
    loading,
    error,
    successMessage,
    addProduto,
    addServico,
    removerItem,
    fechar,
    cancelar,
    checkSlotAvailability,
  } = useComanda(comandaId);

  const produtosPicker = useProdutos(5);
  const servicosPicker = useServicos(5);

  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState('');
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  const [servicoIdSelecionado, setServicoIdSelecionado] = useState('');
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaTime, setAgendaTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sinalPago, setSinalPago] = useState(false);
  const [typePaymentServico, setTypePaymentServico] = useState('pix');

  const [isFecharModalOpen, setIsFecharModalOpen] = useState(false);
  const [typePaymentFechamento, setTypePaymentFechamento] = useState('pix');

  const servicoSelecionadoObj = servicosPicker.servicos.find((s) => s.id === servicoIdSelecionado);
  const servicoExigeAgendamento = servicoSelecionadoObj?.requerAgendamento !== false;

  async function handleAddProduto() {
    if (!produtoIdSelecionado) return;
    await addProduto(produtoIdSelecionado, quantidadeSelecionada);
    setProdutoIdSelecionado('');
    setQuantidadeSelecionada(1);
  }

  async function loadSlotsForDate(date) {
    if (!date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    const data = await checkSlotAvailability(date);
    setSlots(data ?? []);
    setLoadingSlots(false);
  }

  function handleAgendaDateChange(date) {
    setAgendaDate(date);
    setAgendaTime('');
    loadSlotsForDate(date);
  }

  async function handleAddServico() {
    if (!servicoIdSelecionado) return;
    if (servicoExigeAgendamento && (!agendaDate || !agendaTime)) return;

    const dto = {
      servicoId: servicoIdSelecionado,
      sinalPago,
      typePayment: typePaymentServico,
      ...(servicoExigeAgendamento ? { agenda: `${agendaDate}T${agendaTime}:00` } : {}),
    };

    await addServico(dto);
    setServicoIdSelecionado('');
    setAgendaDate('');
    setAgendaTime('');
    setSlots([]);
    setSinalPago(false);
  }

  async function handleFechar() {
    await fechar(typePaymentFechamento);
    setIsFecharModalOpen(false);
  }

  if (loading) return <div className="orderadm-card">Carregando comanda...</div>;
  if (error) return <div className="orderadm-card">Erro: {error.message}</div>;
  if (!comanda) return null;

  return (
    <div className="orderadm-card">
      <div className="orderadm-header">
        <button type="button" className="btn-ghost" onClick={onVoltar}>← Voltar</button>
        <h1>Comanda — {comanda.customerId?.name}</h1>
      </div>

      {successMessage && <p className="orderadm-alert-success">{successMessage}</p>}

      <div className="details-box">
        <p><strong>Status:</strong> {comanda.status}</p>
        <p><strong>Cliente:</strong> {comanda.customerId?.name} — {comanda.customerId?.phone}</p>
      </div>

      {comanda.status === 'ABERTA' && (
        <>
          {/* ADICIONAR PRODUTO */}
          <div className="form-field form-field-bordered">
            <label className="form-label">Adicionar produto</label>
            <div className="entity-picker-wrapper" style={{ marginBottom: '10px' }}>
              <EntityPicker
                items={produtosPicker.produtos}
                loading={produtosPicker.loading}
                search={produtosPicker.search}
                onSearchChange={produtosPicker.updateSearch}
                page={produtosPicker.page}
                totalPages={produtosPicker.pagination.totalPages}
                onPageChange={produtosPicker.setPage}
                selectedId={produtoIdSelecionado}
                onSelect={setProdutoIdSelecionado}
                renderLabel={(p) => `${p.name} — R$ ${p.price} (estoque: ${p.quantity ?? '—'})`}
                placeholder="Buscar produto"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                style={{ width: '90px' }}
                type="number"
                min="1"
                value={quantidadeSelecionada}
                onChange={(e) => setQuantidadeSelecionada(Number(e.target.value))}
              />
              <button type="button" className="cart-add-btn" onClick={handleAddProduto}>
                + Adicionar produto
              </button>
            </div>
          </div>

          {/* ADICIONAR SERVIÇO */}
          <div className="form-field form-field-bordered">
            <label className="form-label">Adicionar serviço</label>
            <div className="entity-picker-wrapper" style={{ marginBottom: '10px' }}>
              <EntityPicker
                items={servicosPicker.servicos}
                loading={servicosPicker.loading}
                search={servicosPicker.search}
                onSearchChange={servicosPicker.updateSearch}
                page={servicosPicker.page}
                totalPages={servicosPicker.pagination.totalPages}
                onPageChange={servicosPicker.setPage}
                selectedId={servicoIdSelecionado}
                onSelect={setServicoIdSelecionado}
                renderLabel={(s) => `${s.name} — R$ ${s.price}${s.requerAgendamento === false ? ' (sem agendamento)' : ''}`}
                placeholder="Buscar serviço"
              />
            </div>

            {servicoIdSelecionado && servicoExigeAgendamento && (
              <>
                <input
                  className="form-input"
                  style={{ maxWidth: '200px' }}
                  type="date"
                  value={agendaDate}
                  onChange={(e) => handleAgendaDateChange(e.target.value)}
                />
                {agendaDate && (
                  <div className="slots-grid">
                    {loadingSlots ? (
                      <p>Carregando horários...</p>
                    ) : (
                      slots.map((slot) => (
                        <button
                          key={slot.horario}
                          type="button"
                          disabled={!slot.disponivel}
                          className={`slot-btn ${agendaTime === slot.horario ? 'slot-selected' : ''}`}
                          onClick={() => setAgendaTime(slot.horario)}
                        >
                          {slot.horario}
                          <br />
                          <small>{slot.vagasRestantes} vaga(s)</small>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {servicoIdSelecionado && (
              <>
                <div className="sinal-box">
                  <label className="sinal-checkbox">
                    <input type="checkbox" checked={sinalPago} onChange={() => setSinalPago(true)} />
                    Vai pagar somente o sinal (R$ 20)
                  </label>
                  <label className="sinal-checkbox">
                    <input type="checkbox" checked={!sinalPago} onChange={() => setSinalPago(false)} />
                    Vai pagar o valor total agora
                  </label>
                </div>

                <select
                  className="form-select"
                  value={typePaymentServico}
                  onChange={(e) => setTypePaymentServico(e.target.value)}
                >
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>

                <button
                  type="button"
                  className="cart-add-btn"
                  onClick={handleAddServico}
                  disabled={servicoExigeAgendamento && (!agendaDate || !agendaTime)}
                >
                  + Adicionar serviço
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* LISTA DE ITENS DA COMANDA */}
      <h3>Itens</h3>
      <ul className="details-list">
        {comanda.itens.map((item) => (
          <li key={item.id} className="details-list-item">
            {item.tipo === 'PRODUTO' ? (
              <>
                <strong>{item.produtoId?.name}</strong> — qtd: {item.quantidade} — R$ {item.valorTotal}
              </>
            ) : (
              <>
                <strong>{item.servicoId?.name}</strong> — R$ {item.valorTotal}
                {item.agenda && <> — {new Date(item.agenda).toLocaleString('pt-BR')}</>}
                {item.numeroAtendimento && <> — #{item.numeroAtendimento}</>}
                {' — '}
                <span className={item.valorTotal - item.valorPago > 0 ? 'payment-pending' : 'payment-paid'}>
                  {item.valorTotal - item.valorPago > 0 ? `Pendente R$ ${item.valorTotal - item.valorPago}` : 'PAGO'}
                </span>
              </>
            )}
            {comanda.status === 'ABERTA' && item.valorPago === 0 && (
              <button type="button" className="cart-item-remove" onClick={() => removerItem(item.id)}>
                Remover
              </button>
            )}
          </li>
        ))}
        {comanda.itens.length === 0 && <li>Nenhum item adicionado ainda.</li>}
      </ul>

      <div className="summary-total">
        <span>Total</span>
        <span className="total-value">R$ {comanda.total}</span>
      </div>
      <div className="summary-row">
        <span>Pendente</span>
        <strong>R$ {comanda.totalPendente}</strong>
      </div>

      {comanda.status === 'ABERTA' && (
        <div className="modal-footer">
          <button type="button" className="btn-danger" onClick={cancelar}>
            Cancelar comanda
          </button>
          <button
            type="button"
            className="btn-gold"
            disabled={comanda.itens.length === 0}
            onClick={() => setIsFecharModalOpen(true)}
          >
            Fechar conta
          </button>
        </div>
      )}

      {isFecharModalOpen && (
        <div className="modal-overlay modal-overlay-top">
          <div className="modal-content modal-content-small">
            <h2 style={{ color: '#DFAF2B', fontSize: '18px', margin: '0 0 8px', fontWeight: 600 }}>
              Fechar conta — R$ {comanda.totalPendente}
            </h2>
            <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
              Como o cliente vai pagar o valor pendente?
            </p>

            <select
              className="form-select"
              value={typePaymentFechamento}
              onChange={(e) => setTypePaymentFechamento(e.target.value)}
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn-gold" onClick={handleFechar}>
                Confirmar fechamento
              </button>
              <button type="button" className="btn-danger" onClick={() => setIsFecharModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}