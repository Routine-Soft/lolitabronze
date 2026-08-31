import { useState } from "react";
import { useOrders, useOrder } from "../order.hooks";
import { useCustomers } from "../../customer/customer.hooks";
import { useProdutos } from "../../produto/produto.hooks";
import { useServicos } from "../../servico/servico.hooks";
import EntityPicker from "../../shared/components/EntityPicker";
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
    novaOrder,
  } = useOrders();

  const customersPicker = useCustomers(5);

  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [observacao, setObservacao] = useState('');

  const [orderSelecionadaId, setOrderSelecionadaId] = useState(null);

  async function handleAbrirOrder(e) {
    e.preventDefault();
    if (!customerId) return;
    const nova = await novaOrder(customerId, observacao);
    setCustomerId('');
    setObservacao('');
    setIsAbrirModalOpen(false);
    if (nova) setOrderSelecionadaId(nova.id);
  }

  if (orderSelecionadaId) {
    return (
      <OrderDetalhe
        orderId={orderSelecionadaId}
        onVoltar={() => setOrderSelecionadaId(null)}
        onExcluida={() => setOrderSelecionadaId(null)}
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
          onClick={() => setFiltros({ ...filtros, dia: new Date().toISOString().split('T')[0] })}
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
            <option value="">Todas</option>
            <option value="ABERTA">Abertas</option>
            <option value="FECHADA">Fechadas</option>
            <option value="CANCELADA">Canceladas</option>
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
            <option value="PENDENTE">Pendente</option>
            <option value="COMPLETO">Pago completo</option>
          </select>
        </div>

        <button type="button" className="btn-ghost" onClick={() => { setFiltros({}); setFiltroPagamento(''); }}>
          Limpar filtros
        </button>
      </div>

      <div className="orders-list">
        {orders.length === 0 && <p className="orders-list-empty">Nenhuma comanda encontrada.</p>}

        {orders.map((o) => (
          <div key={o.id} className="orders-list-item" onClick={() => setOrderSelecionadaId(o.id)}>
            <p>
              <span className="order-tag">Comanda #{o.id.slice(-6)}</span>
              {' — '}
              <span className="order-meta">
                <b>{o.customerId?.name} - {o.customerId?.phone}</b> &nbsp;
                <span className={`order-status status-${o.status?.toLowerCase()}`}>{o.status}</span>
                &nbsp;
                <span
                  className={
                    o.totalPendente > 0
                      ? 'payment-pending'
                      : o.total > 0
                      ? 'payment-paid'
                      : 'payment-empty'
                  }
                >
                  {o.totalPendente > 0
                    ? `Pendente R$ ${o.totalPendente}`
                    : o.total > 0
                    ? 'PAGO'
                    : 'Sem itens'}
                </span>
              </span>
            </p>
            <p className="orders-list-item-sub">
              {o.itens.length} item(ns) — Total: R$ {o.total} —{' '}
              {o.itens.map((i) => (i.tipo === 'PRODUTO' ? i.produtoId?.name : i.servicoId?.name)).filter(Boolean).join(', ')}
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

            <form id="abrir-order-form" onSubmit={handleAbrirOrder} className="modal-body">
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
              <button type="submit" form="abrir-order-form" className="btn-primary" disabled={!customerId}>
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

function OrderDetalhe({ orderId, onVoltar, onExcluida }) {
  const {
    order,
    loading,
    error,
    successMessage,
    adicionarProduto,
    adicionarServico,
    editarItemProduto,
    editarItemServico,
    removerItem,
    fechar,
    cancelar,
    excluir,
    checkSlotAvailability,
  } = useOrder(orderId);

  const produtosPicker = useProdutos(1000);
  const servicosPicker = useServicos(1000);

  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState('');
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  const [servicoIdSelecionado, setServicoIdSelecionado] = useState('');
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaTime, setAgendaTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formaPagamentoServico, setFormaPagamentoServico] = useState('TOTAL'); // 'SINAL' | 'TOTAL' | 'NENHUM'
  const [typePaymentServico, setTypePaymentServico] = useState('pix');

  const [isFecharModalOpen, setIsFecharModalOpen] = useState(false);
  const [pagamentos, setPagamentos] = useState([{ typePayment: 'pix', valor: '' }]);

  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [estornoEscolhido, setEstornoEscolhido] = useState('NENHUM');

  const [editingItemId, setEditingItemId] = useState(null);
  const [editQuantidade, setEditQuantidade] = useState(1);
  const [editAgendaDate, setEditAgendaDate] = useState('');
  const [editAgendaTime, setEditAgendaTime] = useState('');

  const servicoSelecionadoObj = servicosPicker.servicos.find((s) => s.id === servicoIdSelecionado);
  const servicoExigeAgendamento = servicoSelecionadoObj?.requerAgendamento !== false;

  async function handleAddProduto() {
    if (!produtoIdSelecionado) return;
    await adicionarProduto(produtoIdSelecionado, quantidadeSelecionada);
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
      formaPagamento: formaPagamentoServico,
      ...(formaPagamentoServico !== 'NENHUM' ? { typePayment: typePaymentServico } : {}),
      ...(servicoExigeAgendamento ? { agenda: `${agendaDate}T${agendaTime}:00` } : {}),
    };

    await adicionarServico(dto);
    setServicoIdSelecionado('');
    setAgendaDate('');
    setAgendaTime('');
    setSlots([]);
    setFormaPagamentoServico('TOTAL');
  }

  function startEditingItem(item) {
    setEditingItemId(item.id);
    if (item.tipo === 'PRODUTO') {
      setEditQuantidade(item.quantidade);
    } else {
      const agendaStr = item.agenda ? new Date(item.agenda).toISOString().slice(0, 16) : '';
      const [datePart, timePart] = agendaStr.split('T');
      setEditAgendaDate(datePart ?? '');
      setEditAgendaTime(timePart ?? '');
      if (datePart) loadSlotsForDate(datePart);
    }
  }

  async function handleSalvarEdicaoItem(item) {
    if (item.tipo === 'PRODUTO') {
      await editarItemProduto(item.id, editQuantidade);
    } else {
      await editarItemServico(item.id, `${editAgendaDate}T${editAgendaTime}:00`);
    }
    setEditingItemId(null);
  }

  // ---- remoção de item (com estorno quando já tem pagamento) ----

  function handleClickRemover(item) {
    if (item.valorPago > 0) {
      setItemParaRemover(item);
      setEstornoEscolhido('NENHUM');
    } else {
      removerItem(item.id);
    }
  }

  async function confirmarRemocaoComEstorno() {
    await removerItem(itemParaRemover.id, estornoEscolhido);
    setItemParaRemover(null);
  }

  // ---- fechamento com múltiplas formas de pagamento ----

  function addLinhaPagamento() {
    setPagamentos([...pagamentos, { typePayment: 'pix', valor: '' }]);
  }

  function removerLinhaPagamento(index) {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  }

  function updateLinhaPagamento(index, campo, valor) {
    setPagamentos(pagamentos.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  }

  const somaPagamentos = pagamentos.reduce((s, p) => s + Number(p.valor || 0), 0);
  const diferencaPagamento = order ? Number((order.totalPendente - somaPagamentos).toFixed(2)) : 0;

  function preencherRestante(index) {
    const restanteSemEssaLinha = order.totalPendente - (somaPagamentos - Number(pagamentos[index].valor || 0));
    updateLinhaPagamento(index, 'valor', Math.max(0, restanteSemEssaLinha));
  }

  async function handleFechar() {
    if (order.totalPendente === 0) {
      await fechar([]);
      setIsFecharModalOpen(false);
      return;
    }
    if (diferencaPagamento !== 0) return;
    await fechar(pagamentos.map((p) => ({ typePayment: p.typePayment, valor: Number(p.valor) })));
    setIsFecharModalOpen(false);
    setPagamentos([{ typePayment: 'pix', valor: '' }]);
  }

  function abrirModalFechar() {
    setPagamentos([{ typePayment: 'pix', valor: order?.totalPendente ?? '' }]);
    setIsFecharModalOpen(true);
  }

  if (loading) return <div className="orderadm-card">Carregando comanda...</div>;
  if (error) return <div className="orderadm-card">Erro: {error.message}</div>;
  if (!order) return null;

  return (
    <div className="orderadm-card">
      <div className="orderadm-header">
        <button type="button" className="btn-ghost" onClick={onVoltar}>← Voltar</button>
        <h1>Comanda — {order.customerId?.name}</h1>
      </div>

      {successMessage && <p className="orderadm-alert-success">{successMessage}</p>}

      <div className="details-box">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Cliente:</strong> {order.customerId?.name} — {order.customerId?.phone}</p>
      </div>

      {order.status === 'ABERTA' && (
        <>
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
                showPagination={false}
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
                showPagination={false}
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
                    <input
                      type="radio"
                      name="formaPagamentoServico"
                      checked={formaPagamentoServico === 'TOTAL'}
                      onChange={() => setFormaPagamentoServico('TOTAL')}
                    />
                    Vai pagar o valor total agora
                  </label>
                  <label className="sinal-checkbox">
                    <input
                      type="radio"
                      name="formaPagamentoServico"
                      checked={formaPagamentoServico === 'SINAL'}
                      onChange={() => setFormaPagamentoServico('SINAL')}
                    />
                    Vai pagar somente o sinal (R$ 20)
                  </label>
                  <label className="sinal-checkbox">
                    <input
                      type="radio"
                      name="formaPagamentoServico"
                      checked={formaPagamentoServico === 'NENHUM'}
                      onChange={() => setFormaPagamentoServico('NENHUM')}
                    />
                    Não vai pagar nada agora
                  </label>
                </div>

                {formaPagamentoServico !== 'NENHUM' && (
                  <select
                    className="form-select"
                    value={typePaymentServico}
                    onChange={(e) => setTypePaymentServico(e.target.value)}
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                  </select>
                )}

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

      <h3>Itens</h3>
      <ul className="details-list">
        {order.itens.map((item) => (
          <li key={item.id} className="details-list-item">
            {editingItemId === item.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.tipo === 'PRODUTO' ? (
                  <input
                    className="form-input"
                    style={{ width: '90px' }}
                    type="number"
                    min="1"
                    value={editQuantidade}
                    onChange={(e) => setEditQuantidade(Number(e.target.value))}
                  />
                ) : (
                  <>
                    <input
                      className="form-input"
                      style={{ maxWidth: '200px' }}
                      type="date"
                      value={editAgendaDate}
                      onChange={(e) => { setEditAgendaDate(e.target.value); setEditAgendaTime(''); loadSlotsForDate(e.target.value); }}
                    />
                    <div className="slots-grid">
                      {slots.map((slot) => (
                        <button
                          key={slot.horario}
                          type="button"
                          disabled={!slot.disponivel}
                          className={`slot-btn ${editAgendaTime === slot.horario ? 'slot-selected' : ''}`}
                          onClick={() => setEditAgendaTime(slot.horario)}
                        >
                          {slot.horario}
                          <br />
                          <small>{slot.vagasRestantes} vaga(s)</small>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div>
                  <button type="button" className="cart-add-btn" onClick={() => handleSalvarEdicaoItem(item)}>
                    Salvar
                  </button>
                  <button type="button" className="cart-item-remove" onClick={() => setEditingItemId(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
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

                {order.status === 'ABERTA' && (
                  <>
                    {item.tipo === 'PRODUTO' && item.valorPago === 0 && (
                      <>
                        <button type="button" className="cart-item-remove" onClick={() => startEditingItem(item)}>
                          Editar
                        </button>
                        <button type="button" className="cart-item-remove" onClick={() => handleClickRemover(item)}>
                          Remover
                        </button>
                      </>
                    )}

                    {item.tipo === 'SERVICO' && (
                      <>
                        {item.valorPago === 0 && (
                          <button type="button" className="cart-item-remove" onClick={() => startEditingItem(item)}>
                            Editar
                          </button>
                        )}
                        {item.statusServico === 'AGENDADO' && item.valorPago > 0 && (
                          <button type="button" className="cart-item-remove" onClick={() => startEditingItem(item)}>
                            Reagendar
                          </button>
                        )}
                        <button type="button" className="cart-item-remove" onClick={() => handleClickRemover(item)}>
                          Remover
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </li>
        ))}
        {order.itens.length === 0 && <li>Nenhum item adicionado ainda.</li>}
      </ul>

      <div className="summary-total">
        <span>Total</span>
        <span className="total-value">R$ {order.total}</span>
      </div>
      <div className="summary-row">
        <span>Pendente</span>
        <strong>R$ {order.totalPendente}</strong>
      </div>

      <div className="modal-footer">
        {order.status === 'ABERTA' && (
          <>
            <button type="button" className="btn-danger" onClick={cancelar}>
              Cancelar comanda
            </button>
            <button
              type="button"
              className="btn-gold"
              disabled={order.itens.length === 0}
              onClick={abrirModalFechar}
            >
              Fechar conta
            </button>
          </>
        )}
        <button
          type="button"
          className="btn-danger"
          onClick={async () => {
            await excluir();
            onExcluida();
          }}
        >
          Excluir comanda
        </button>
      </div>

      {/* ====== MODAL: ESTORNO AO REMOVER ITEM JÁ PAGO ====== */}
      {itemParaRemover && (
        <div className="modal-overlay modal-overlay-top">
          <div className="modal-content modal-content-small">
            <h2 style={{ color: '#DFAF2B', fontSize: '18px', margin: '0 0 8px', fontWeight: 600 }}>
              Remover item com pagamento
            </h2>
            <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
              Este item tem R$ {itemParaRemover.valorPago} pago. O que fazer com esse valor?
            </p>

            <select
              className="form-select"
              value={estornoEscolhido}
              onChange={(e) => setEstornoEscolhido(e.target.value)}
            >
              <option value="TOTAL">Devolver o valor total pago (R$ {itemParaRemover.valorPago})</option>
              <option value="SINAL">Devolver só o sinal (R$ 20)</option>
              <option value="NENHUM">Não devolver nada</option>
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn-gold" onClick={confirmarRemocaoComEstorno}>
                Confirmar remoção
              </button>
              <button type="button" className="btn-danger" onClick={() => setItemParaRemover(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: FECHAR CONTA COM MÚLTIPLAS FORMAS DE PAGAMENTO ====== */}
{isFecharModalOpen && (
  <div className="modal-overlay modal-overlay-top">
    <div className="modal-content modal-content-small">
      <h2 style={{ color: '#DFAF2B', fontSize: '18px', margin: '0 0 8px', fontWeight: 600 }}>
        Fechar conta — R$ {order.totalPendente}
      </h2>

      {order.totalPendente === 0 ? (
        <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
          Esta comanda já está totalmente paga. Não é preciso registrar nenhum pagamento — só confirmar o fechamento.
        </p>
      ) : (
        <>
          <p style={{ color: '#A9A3AE', fontSize: '14px', marginBottom: '16px' }}>
            Como o cliente vai pagar o valor pendente? Pode dividir em quantas formas quiser.
          </p>

          {pagamentos.map((p, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <select
                className="form-select"
                value={p.typePayment}
                onChange={(e) => updateLinhaPagamento(index, 'typePayment', e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                style={{ width: '100px' }}
                value={p.valor}
                onChange={(e) => updateLinhaPagamento(index, 'valor', e.target.value)}
                placeholder="Valor"
              />
              <button type="button" className="btn-ghost" onClick={() => preencherRestante(index)}>
                Preencher restante
              </button>
              {pagamentos.length > 1 && (
                <button type="button" className="cart-item-remove" onClick={() => removerLinhaPagamento(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn-ghost" onClick={addLinhaPagamento} style={{ marginBottom: '12px' }}>
            + Adicionar outra forma de pagamento
          </button>

          <p style={{ fontSize: '14px', color: diferencaPagamento === 0 ? '#5FBF77' : '#E05353' }}>
            {diferencaPagamento === 0
              ? 'Valores conferem.'
              : diferencaPagamento > 0
              ? `Faltam R$ ${diferencaPagamento.toFixed(2)}`
              : `Excedeu em R$ ${Math.abs(diferencaPagamento).toFixed(2)}`}
          </p>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <button
          type="button"
          className="btn-gold"
          onClick={handleFechar}
          disabled={order.totalPendente !== 0 && diferencaPagamento !== 0}
        >
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