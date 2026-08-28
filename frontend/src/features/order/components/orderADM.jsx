import { useOrders } from "../order.hooks";
import { useCustomers } from "../../customer/customer.hooks";
import { useProdutos } from "../../produto/produto.hooks";
import { useServicos } from "../../servico/servico.hooks";
import EntityPicker from "../../shared/components/EntityPicker";
import { useState } from "react";
import "./orderADM.css";

export default function OrderADM() {
  const {
    orders,
    loading,
    error,
    successMessage,
    filtros,
    setFiltros,
    filtroPagamento,
    setFiltroPagamento,
    addOrder,
    editOrder,
    removeOrder,
    changeStatus,
    payRemaining,
    cancelOrder,
    checkSlotAvailability,
  } = useOrders();

  const customersPicker = useCustomers(5);
  const produtosPicker = useProdutos(5);
  const servicosPicker = useServicos(5);

  const [editingId, setEditingId] = useState(null);

  const [customerId, setCustomerId] = useState('');
  const [tipo, setTipo] = useState('SERVICO'); // 'SERVICO' | 'PRODUTO'
  const [typePayment, setTypePayment] = useState('pix');
  const [observacao, setObservacao] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);

  // campos só de SERVICO
  const [servicoId, setServicoId] = useState('');
  const [agenda, setAgenda] = useState('');
  const [sinalPago, setSinalPago] = useState(false);

  // campos só de PRODUTO — carrinho
  const [produtosCarrinho, setProdutosCarrinho] = useState([]);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState('');
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [formErro, setFormErro] = useState('');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPagarRestanteModalOpen, setIsPagarRestanteModalOpen] = useState(false);
  const [typePaymentRestante, setTypePaymentRestante] = useState('pix');

  // Slots
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaTime, setAgendaTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  function resetForm() {
    setCustomerId('');
    setTipo('SERVICO');
    setTypePayment('pix');
    setObservacao('');
    setServicoId('');
    setAgenda('');
    setSinalPago(false);
    setProdutosCarrinho([]);
    setProdutoIdSelecionado('');
    setQuantidadeSelecionada(1);
    setEditingId(null);
    setAgendaDate('');   // novo
    setAgendaTime('');   // novo
    setSlots([]);        // novo
    setFormErro('');
  }

  function handleAddProdutoAoCarrinho() {
    if (!produtoIdSelecionado) return;
    setProdutosCarrinho([
      ...produtosCarrinho,
      { produtoId: produtoIdSelecionado, quantidade: quantidadeSelecionada },
    ]);
    setProdutoIdSelecionado('');
    setQuantidadeSelecionada(1);
    setFormErro('');
  }

  function handleRemoveProdutoDoCarrinho(index) {
    setProdutosCarrinho(produtosCarrinho.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();

      if (!customerId) {
        setFormErro('Selecione um cliente antes de criar o pedido.');
        return;
      }

    // trava local: produto sem nenhum item no carrinho não pode nem tentar submeter
    if (tipo === 'PRODUTO' && produtosCarrinho.length === 0) {
      setFormErro('Adicione ao menos um produto ao pedido antes de criar.');
      return;
    }
    setFormErro('');

    // criação exige tipo; edição não permite trocar tipo (backend não aceita)
    const orderData = editingId
      ? {
          customerId,
          typePayment,
          observacao,
          ...(tipo === 'SERVICO' ? { agenda } : { produtos: produtosCarrinho }),
        }
      : {
          customerId,
          tipo,
          typePayment,
          observacao,
          ...(tipo === 'SERVICO'
            ? { servicoId, agenda, sinalPago }
            : { produtos: produtosCarrinho }),
        };

    let resultado;
    if (editingId) {
      resultado = await editOrder(editingId, orderData);
    } else {
      resultado = await addOrder(orderData);
    }

    // se addOrder/editOrder falhou, o hook já setou `error` — não fecha o modal, deixa o usuário corrigir
    if (resultado) {
      resetForm();
      setIsCreateModalOpen(false);
    }
  }

  function startEditing(order) {
    setEditingId(order.id);
    setCustomerId(order.customerId?._id ?? order.customerId);
    setTipo(order.tipo);
    setTypePayment(order.typePayment);
    setObservacao(order.observacao ?? '');

    if (order.tipo === 'SERVICO') {
    setServicoId(order.servicoId?._id ?? order.servicoId);

      const agendaStr = order.agenda ? order.agenda.slice(0, 16) : ''; // 'YYYY-MM-DDTHH:mm'
      setAgenda(agendaStr);

      if (agendaStr) {
        const [datePart, timePart] = agendaStr.split('T');
        setAgendaDate(datePart);
        setAgendaTime(timePart);
        loadSlotsForDate(datePart); // carrega os slots do dia já agendado
      }

      setSinalPago(order.sinalPago);
    } else {
      setProdutosCarrinho(
        order.produtos.map((p) => ({
          produtoId: p.produtoId?._id ?? p.produtoId,
          quantidade: p.quantidade,
        }))
      );
    }

    setIsCreateModalOpen(true);
  }

  function handleCancelForm() {
    resetForm();
    setIsCreateModalOpen(false);
  }

  async function handleCancelOrder(reembolso) {
    await cancelOrder(selectedOrder.id, reembolso);
    setIsCancelModalOpen(false);
    setSelectedOrder(null);
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
    setAgenda('');
    loadSlotsForDate(date);
  }

  function handleSelectSlot(horario) {
    if (!agendaDate) return;
    setAgendaTime(horario);
    setAgenda(`${agendaDate}T${horario}:00`);
  }

  function handleFiltroHoje() {
    const hoje = new Date().toISOString().split('T')[0];

    setFiltros({
      ...filtros,
      dia: hoje,
    });
  }

  async function handlePagarRestante() {
    await payRemaining(selectedOrder.id, typePaymentRestante);
    setIsPagarRestanteModalOpen(false);
    setSelectedOrder(null);
  }

  if (loading)
    return <div className="orderadm-card">Carregando pedidos...</div>;
  if (error)
    return <div className="orderadm-card">Erro: {error.message}</div>;

  return (
    <div className="orderadm-card">
      <div className="orderadm-header">
        <h1>📅 Agenda</h1>
        <button type="button" className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          + Criar pedido
        </button>
      </div>

      {successMessage && <p className="orderadm-alert-success">{successMessage}</p>}

      {/* Modal: Criar / Editar pedido */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-form">
            <div className="modal-header">
              <h2>{editingId ? "Editar pedido" : "Criar pedido"}</h2>
              <button type="button" className="btn-close-icon" onClick={handleCancelForm}>✕</button>
            </div>

            {error && <p className="orderadm-alert-error">{error.message}</p>}

            <form id="order-form" onSubmit={handleSubmit} className="modal-body">
              {formErro && (
                <p className="orderadm-alert-error">{formErro}</p>
              )}
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

              <div className="form-field form-field-bordered">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={!!editingId}
                >
                  <option value="SERVICO">Serviço</option>
                  <option value="PRODUTO">Produto</option>
                </select>
              </div>

              {tipo === 'SERVICO' && (
                <div className="form-field form-field-bordered" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!editingId && (
                    <div>
                      <label className="form-label">Serviço</label>
                      <div className="entity-picker-wrapper">
                        <EntityPicker
                          items={servicosPicker.servicos}
                          loading={servicosPicker.loading}
                          search={servicosPicker.search}
                          onSearchChange={servicosPicker.updateSearch}
                          page={servicosPicker.page}
                          totalPages={servicosPicker.pagination.totalPages}
                          onPageChange={servicosPicker.setPage}
                          selectedId={servicoId}
                          onSelect={setServicoId}
                          renderLabel={(s) => `${s.name} — R$ ${s.price}`}
                          placeholder="Buscar serviço"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Data do agendamento</label>
                    <input
                      className="form-input"
                      style={{ maxWidth: '200px' }}
                      type="date"
                      value={agendaDate}
                      onChange={(e) => handleAgendaDateChange(e.target.value)}
                    />
                  </div>

                  {agendaDate && (
                    <div>
                      <label className="form-label">Horário disponível</label>
                      {loadingSlots ? (
                        <p>Carregando horários...</p>
                      ) : (
                        <div className="slots-grid">
                          {slots.map((slot) => (
                            <button
                              key={slot.horario}
                              type="button"
                              disabled={!slot.disponivel}
                              className={`slot-btn ${agendaTime === slot.horario ? 'slot-selected' : ''}`}
                              onClick={() => handleSelectSlot(slot.horario)}
                            >
                              {slot.horario}
                              <br />
                              <small>{slot.vagasRestantes} vaga(s)</small>
                            </button>
                          ))}
                          {slots.length === 0 && <p>Nenhum horário disponível para esse dia.</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {!editingId && (
                    <div className="sinal-box">
                      <label className="form-label">Como o cliente vai pagar?</label>
                      <label className="sinal-checkbox">
                        <input
                          type="checkbox"
                          checked={sinalPago}
                          onChange={() => setSinalPago(true)}
                        />
                        Vai pagar somente o sinal (R$ 20)
                      </label>
                      <label className="sinal-checkbox">
                        <input
                          type="checkbox"
                          checked={!sinalPago}
                          onChange={() => setSinalPago(false)}
                        />
                        Vai pagar o valor total
                      </label>
                    </div>
                  )}
                </div>
              )}

              {tipo === 'PRODUTO' && (
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
                    <button type="button" className="cart-add-btn" onClick={handleAddProdutoAoCarrinho}>
                      + Adicionar ao pedido
                    </button>
                  </div>

                  {produtosCarrinho.length > 0 && (
                    <ul className="cart-list">
                      {produtosCarrinho.map((item, index) => {
                        const produto = produtosPicker.produtos.find((p) => p.id === item.produtoId);
                        return (
                          <li key={index} className="cart-item">
                            <span>
                              <span className="cart-item-name">{produto?.name ?? item.produtoId}</span>
                              {' — qtd: '}{item.quantidade}
                            </span>
                            <button
                              type="button"
                              className="cart-item-remove"
                              onClick={() => handleRemoveProdutoDoCarrinho(index)}
                            >
                              Remover
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              <div className="form-field">
                <label className="form-label">Forma de pagamento</label>
                <select className="form-select" value={typePayment} onChange={(e) => setTypePayment(e.target.value)}>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Observação</label>
                <textarea
                  className="form-textarea"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observação"
                />
              </div>
            </form>

            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={handleCancelForm}>
                Cancelar
              </button>
              <button
                type="submit"
                form="order-form"
                className="btn-primary"
                disabled={!customerId || (tipo === 'PRODUTO' && produtosCarrinho.length === 0)}
              >
                {editingId ? "Salvar edição" : "Criar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-bar">
        <div>
          <label className="form-label">Dia</label>
          <input
            className="form-input"
            type="date"
            value={filtros.dia ?? ''}
            onChange={(e) => setFiltros({ ...filtros, dia: e.target.value || undefined })}
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleFiltroHoje}
        >
          Hoje
        </button>

        <div>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filtros.status ?? ''}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={filtros.tipo ?? ''}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            <option value="SERVICO">Serviço</option>
            <option value="PRODUTO">Produto</option>
          </select>
        </div>

        <div>
          <label className="form-label">Pagamento</label>
          <select
            className="form-select"
            value={filtroPagamento}
            onChange={(e) => setFiltroPagamento(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="PENDENTE">Só sinal (falta pagar)</option>
            <option value="COMPLETO">Pago completo</option>
          </select>
        </div>

        <button type="button" className="btn-ghost" onClick={() => { setFiltros({}); setFiltroPagamento(''); }}>
          Limpar filtros
        </button>
      </div>

      {/* Lista */}
      <div className="orders-list">
        {orders.length === 0 && <p className="orders-list-empty">Nenhum pedido encontrado.</p>}

        {orders.map((order) => (
          <div key={order.id} className="orders-list-item" onClick={() => setSelectedOrder(order)}>
            <p>
              <span className="order-tag">
                {order.tipo === 'SERVICO' ? `#${order.numeroAtendimento}` : `Pedido #${order.id}`}
              </span>
              {' — '}
              <span className="order-meta">
                {order.agendaFormatada} <b>{order.customerId?.name} - {order.customerId?.phone}</b> &nbsp;
                <span className={`order-status status-${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
                &nbsp; &nbsp;
              <span className={order.valorRestante > 0 ? 'payment-pending' : 'payment-paid'}>
                {order.valorRestante > 0
                  ? `Pendente R$ ${order.valorRestante}`
                  : 'PAGO'}
              </span>
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Modal: Detalhes do pedido */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-details">
            <div className="modal-header">
              <h2>Detalhes do Pedido</h2>
              <button type="button" className="btn-close-icon" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="details-box">
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Serviço:</strong> {selectedOrder.servicoId.name}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Descrição:</strong> {selectedOrder.servicoId.description}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Cliente:</strong> {selectedOrder.customerId?.name}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Telefone:</strong> {selectedOrder.customerId?.phone}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Criado em:</strong> {selectedOrder.dia} {selectedOrder.hora}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Agenda:</strong> {selectedOrder.agendaFormatada}</p>
                <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Forma de pagamento:</strong> {selectedOrder.typePayment}</p>
                {selectedOrder.observacao && (
                  <p><strong style={{ color: '#A9A3AE', fontWeight: 500 }}>Observação:</strong> {selectedOrder.observacao}</p>
                )}
              </div>

              {selectedOrder.tipo === 'PRODUTO' && (
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Produtos</label>
                  <ul className="details-list">
                    {selectedOrder.produtos.map((p, index) => (
                      <li key={index} className="details-list-item">
                        <strong>{p.produtoId?.name}</strong> — qtd: {p.quantidade} — R$ {p.precoUnitario}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="summary-row">
                  <span>Pago</span>
                  <strong>R$ {selectedOrder.valorPago}</strong>
                </div>
                {selectedOrder.sinalPago && (
                  <div className="summary-row">
                    <span>Pendente</span>
                    <strong>R$ {selectedOrder.valorRestante}</strong>
                  </div>
                )}
                <div className="summary-total">
                  <span>Total</span>
                  <span className="total-value">R$ {selectedOrder.total}</span>
                </div>
                <p className="status-text">
                  Status: <span className="status-value">{selectedOrder.status}</span>
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  startEditing(selectedOrder);
                  setSelectedOrder(null);
                }}
              >
                Editar
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  removeOrder(selectedOrder.id);
                  setSelectedOrder(null);
                }}
              >
                Excluir
              </button>

              {selectedOrder.tipo === 'SERVICO' && selectedOrder.status === 'AGENDADO' && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    changeStatus(selectedOrder.id, 'FINALIZADO');
                    setSelectedOrder(null);
                  }}
                >
                  Marcar como Finalizado
                </button>
              )}

              {selectedOrder.tipo === 'SERVICO' && selectedOrder.valorRestante > 0 && (
                <button
                  type="button"
                  className="btn-gold"
                  onClick={() => {
                    setTypePaymentRestante(selectedOrder.typePayment); // sugere a forma usada no sinal, mas deixa trocar
                    setIsPagarRestanteModalOpen(true);
                  }}
                >
                  Pagar restante (R$ {selectedOrder.valorRestante})
                </button>
              )}

              {selectedOrder.tipo === 'SERVICO' && selectedOrder.status === 'AGENDADO' && (
                <button type="button" className="btn-danger" onClick={() => setIsCancelModalOpen(true)}>
                  Cancelar pedido
                </button>
              )}

              <button type="button" className="btn-primary" onClick={() => setSelectedOrder(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancelar pedido */}
      {isCancelModalOpen && selectedOrder && (
        <div className="modal-overlay modal-overlay-top">
          <div className="modal-content modal-content-small">
            <h2 style={{ color: '#DFAF2B', fontSize: '18px', margin: '0 0 8px', fontWeight: 600 }}>
              Cancelar pedido
            </h2>
            <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
              O que deseja fazer com o valor pago?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="button" className="btn-ghost" onClick={() => handleCancelOrder('NENHUM')}>
                Não devolver
              </button>

              {selectedOrder.valorRestante > 0 && (
                <button type="button" className="btn-gold" onClick={() => handleCancelOrder('SINAL')}>
                  Devolver sinal — R$ {selectedOrder.valorPago}
                </button>
              )}

              {selectedOrder.valorRestante <= 0 && (
                <button type="button" className="btn-gold" onClick={() => handleCancelOrder('TOTAL')}>
                  Devolver valor pago — R$ {selectedOrder.valorPago}
                </button>
              )}

              <button type="button" className="btn-danger" onClick={() => setIsCancelModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pagar restante */}
      {isPagarRestanteModalOpen && selectedOrder && (
        <div className="modal-overlay modal-overlay-top">
          <div className="modal-content modal-content-small">
            <h2 style={{ color: '#DFAF2B', fontSize: '18px', margin: '0 0 8px', fontWeight: 600 }}>
              Pagar restante — R$ {selectedOrder.valorRestante}
            </h2>
            <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
              Como o cliente vai pagar o valor restante?
            </p>

            <select
              className="form-select"
              value={typePaymentRestante}
              onChange={(e) => setTypePaymentRestante(e.target.value)}
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn-gold" onClick={handlePagarRestante}>
                Confirmar pagamento
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setIsPagarRestanteModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}