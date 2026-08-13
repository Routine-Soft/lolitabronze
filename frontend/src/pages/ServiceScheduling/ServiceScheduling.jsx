import { useState, useEffect } from 'react'
import MainLayout from '@/layouts/MainLayout'
import CustomerController from '@/modules/customer/customer.controller'
import ItemController from '@/modules/item/item.controller'
import OrderHistoryController from '@/modules/orderHistory/orderHistory.controller'
import UserController from '@/modules/user/user.controller'
import { validateOrder } from '@/modules/orderHistory/orderHistory.dto'
import './ServiceScheduling.css'

// Formatar data para exibição
function formatDateDisplay(date) {
  if (!date) return ''
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ServiceScheduling() {
  // Estados principais
  const [customers, setCustomers] = useState([])
  const [allServices, setAllServices] = useState([])

  // Formulário
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [typePayment, setTypePayment] = useState('pix')
  const [sinalPago, setSinalPago] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [itemSearch, setItemSearch] = useState('')

  // UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [slotAvailability, setSlotAvailability] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await CustomerController.list()
        await ItemController.list()
        setCustomers([...CustomerController.customers])
        // Filtrar apenas serviços
        const services = ItemController.items.filter(item => item.type === 'SERVICE')
        setAllServices(services)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    const unsubCustomers = CustomerController.subscribe(() => {
      setCustomers([...CustomerController.customers])
    })
    const unsubItems = ItemController.subscribe(() => {
      const services = ItemController.items.filter(item => item.type === 'SERVICE')
      setAllServices(services)
    })

    return () => {
      unsubCustomers && unsubCustomers()
      unsubItems && unsubItems()
    }
  }, [])

  // Carregar disponibilidade de slots quando a data muda
  useEffect(() => {
    if (!selectedDate) {
      return
    }

    const loadSlotAvailability = async () => {
      try {
        setLoadingSlots(true)
        const dateStr = selectedDate.toISOString().split('T')[0]
        const response = await fetch(`http://localhost:8080/api/orders-availability?date=${dateStr}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        
        if (!response.ok) {
          throw new Error('Erro ao carregar disponibilidade de slots')
        }

        const data = await response.json()
        setSlotAvailability(data)
      } catch (err) {
        console.error('Erro ao carregar slots:', err)
        setSlotAvailability([])
      } finally {
        setLoadingSlots(false)
      }
    }

    loadSlotAvailability()
  }, [selectedDate])

  // Filtrar clientes por busca
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers

  // Filtrar serviços por busca
  const filteredItems = allServices.filter(item =>
    itemSearch.trim() === '' ||
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(itemSearch.toLowerCase())
  )

  // Calcular preço com desconto
  const calculateDiscountedPrice = (item) => {
    if (!item.discount?.percentual || item.discount.percentual === 0) {
      return item.price
    }
    return item.price * (1 - item.discount.percentual / 100)
  }

  // Calcular total
  const cartTotal = cartItems.reduce((sum, item) => {
    const discountedPrice = calculateDiscountedPrice(item)
    return sum + (discountedPrice * item.quantity)
  }, 0)

  // Adicionar item ao carrinho
  const handleAddItemToCart = (item) => {
    const exists = cartItems.find(ci => ci.id === item.id)
    if (exists) {
      setCartItems(
        cartItems.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      )
    } else {
      setCartItems([
        ...cartItems,
        {
          id: item.id,
          itemId: item.id,
          name: item.name,
          price: item.price,
          discount: item.discount,
          quantity: 1,
          type: item.type,
        },
      ])
    }
    setShowItemsModal(false)
  }

  // Atualizar quantidade
  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(i => i.id !== itemId))
    } else {
      setCartItems(
        cartItems.map(i =>
          i.id === itemId ? { ...i, quantity } : i
        )
      )
    }
  }

  // Remover item do carrinho
  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(i => i.id !== itemId))
  }

  // Submeter pedido
  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Validações
      if (!selectedCustomer) {
        setError('Selecione um cliente')
        return
      }

      if (cartItems.length === 0) {
        setError('Adicione pelo menos um serviço')
        return
      }

      if (!selectedDate || !selectedTime) {
        setError('Selecione data e horário')
        return
      }

      if (!sinalPago) {
        setError('Sinal de R$ 20,00 é obrigatório para confirmar o agendamento')
        return
      }

      // Verificar userId
      const currentUser = UserController.currentUser
      const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId
      
      if (!currentUserId) {
        setError('Erro: ID do usuário não encontrado. Faça login novamente.')
        return
      }

      // Construir datetime
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const agendaDateTime = new Date(selectedDate)
      agendaDateTime.setHours(hours, minutes, 0, 0)

      // Validação final
      const orderData = {
        customerId: selectedCustomer.id,
        items: cartItems.map(item => ({
          itemId: item.itemId,
          quantidade: item.quantity,
        })),
        sinal: true,
        userId: currentUserId,
        typePayment,
        agenda: agendaDateTime.toISOString(),
        observacao,
      }

      const validation = validateOrder(orderData)
      if (!validation.isValid) {
        setError(Object.values(validation.errors).join(', '))
        return
      }

      setLoading(true)
      const order = await OrderHistoryController.create(
        selectedCustomer.id,
        cartItems.map(item => ({
          itemId: item.itemId,
          quantidade: item.quantity,
        })),
        currentUserId,
        observacao,
        true,
        typePayment,
        agendaDateTime.toISOString()
      )

      setSuccess(
        `Serviço agendado com sucesso! Número de atendimento: ${order.numeroAtendimento}`
      )

      // Resetar formulário
      setSelectedCustomer(null)
      setCartItems([])
      setSelectedDate(null)
      setSelectedTime('')
      setTypePayment('pix')
      setSinalPago(false)
      setObservacao('')
      setCustomerSearch('')

      // Recarregar pedidos
      await OrderHistoryController.list()
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err.message || 'Erro ao agendar serviço')
    } finally {
      setLoading(false)
    }
  }

  // Gerar data mínima (hoje) e máxima (30 dias)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = today.toISOString().split('T')[0]

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <MainLayout>
      <div className="service-scheduling-container">
        <div className="service-header">
          <h1>Agendamento de Serviços</h1>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✅ {success}
            <button onClick={() => setSuccess(null)} className="alert-close">✕</button>
          </div>
        )}

        <div className="service-content">
          {/* Formulário */}
          <div className="service-form-section">
            <form onSubmit={handleSubmitOrder} className="service-form">
              {/* Seção 1: Cliente */}
              <div className="form-section">
                <h3>1️⃣ Selecione o Cliente</h3>
                <div className="customer-selector">
                  {selectedCustomer ? (
                    <div className="selected-customer">
                      <div className="customer-info">
                        <div className="customer-name">{selectedCustomer.name}</div>
                        <div className="customer-phone">{selectedCustomer.phone}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-change"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setCustomerSearch('')
                        }}
                      >
                        Mudar
                      </button>
                    </div>
                  ) : (
                    <div className="customer-search-wrapper">
                      <input
                        type="text"
                        placeholder="🔍 Buscar cliente por nome ou telefone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="customer-search-input"
                      />
                      {showCustomerDropdown && (
                        <div className="customer-dropdown">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                              <div
                                key={customer.id}
                                className="customer-option"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowCustomerDropdown(false)
                                  setCustomerSearch('')
                                }}
                              >
                                <div className="customer-option-name">{customer.name}</div>
                                <div className="customer-option-phone">{customer.phone}</div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">Nenhum cliente encontrado</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 2: Serviços */}
              <div className="form-section">
                <div className="section-header">
                  <h3>2️⃣ Selecione os Serviços</h3>
                  <button
                    type="button"
                    className="btn-primary-small"
                    onClick={() => setShowItemsModal(true)}
                  >
                    + Adicionar
                  </button>
                </div>

                {cartItems.length > 0 ? (
                  <div className="cart-items-list">
                    {cartItems.map(item => {
                      const discountedPrice = calculateDiscountedPrice(item)
                      return (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-price">
                            {item.discount?.percentual > 0 ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '0.5rem' }}>R$ {item.price.toFixed(2)}</span>
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>R$ {discountedPrice.toFixed(2)}</span>
                              </>
                            ) : (
                              <span>R$ {item.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="cart-item-qty">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="qty-input"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-item-subtotal">
                          R$ {(discountedPrice * item.quantity).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          className="btn-icon delete"
                          onClick={() => handleRemoveFromCart(item.id)}
                          title="Remover"
                        >
                          🗑
                        </button>
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="empty-cart">
                    Nenhum serviço adicionado
                  </div>
                )}
              </div>

              {/* Seção 3: Data e Hora */}
              <div className="form-section">
                <h3>3️⃣ Selecione Data e Horário</h3>
                <div className="form-group">
                  <label htmlFor="agenda-date">Data *</label>
                  <input
                    type="date"
                    id="agenda-date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value + 'T00:00:00')
                        setSelectedDate(date)
                        setSelectedTime('')
                        setSlotAvailability(null)
                      } else {
                        setSelectedDate(null)
                        setSelectedTime('')
                        setSlotAvailability(null)
                      }
                    }}
                    min={minDate}
                    max={maxDateStr}
                    className="form-input date-input"
                    required
                  />
                  {selectedDate && (
                    <div className="date-display">
                      📅 {formatDateDisplay(selectedDate)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="agenda-time">Horário (9:00 - 18:30, slots 30min) *</label>
                  {loadingSlots ? (
                    <div className="form-input" style={{ color: '#A9A3AE' }}>
                      ⏳ Carregando disponibilidade...
                    </div>
                  ) : (
                    <select
                      id="agenda-time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="form-input"
                      required
                      disabled={!slotAvailability || slotAvailability.length === 0}
                    >
                      <option value="">Selecione um horário</option>
                      {slotAvailability && slotAvailability.map(slot => (
                        <option 
                          key={slot.horario} 
                          value={slot.horario}
                          disabled={!slot.disponivel}
                        >
                          {slot.horario} - {slot.vagasRestantes} vaga(s) ({slot.vagasPreenchidas}/10)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Seção 4: Tipo de Pagamento */}
              <div className="form-section">
                <h3>4️⃣ Tipo de Pagamento</h3>
                <div className="payment-options">
                  {['pix', 'dinheiro', 'cartao'].map(type => (
                    <label key={type} className="payment-option">
                      <input
                        type="radio"
                        name="typePayment"
                        value={type}
                        checked={typePayment === type}
                        onChange={(e) => setTypePayment(e.target.value)}
                      />
                      <span className="payment-label">
                        {type === 'pix' && '🔷 Pix'}
                        {type === 'dinheiro' && '💵 Dinheiro'}
                        {type === 'cartao' && '💳 Cartão'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seção 5: Sinal Obrigatório */}
              <div className="form-section">
                <h3>💰 Pagamento do Sinal (Obrigatório)</h3>
                <div className="sinal-box">
                  <div className="sinal-info">
                    <p className="sinal-text">
                      É necessário pagar um sinal de <strong>R$ 20,00</strong> para confirmar o agendamento do serviço.
                    </p>
                  </div>
                  <label className="sinal-checkbox">
                    <input
                      type="checkbox"
                      checked={sinalPago}
                      onChange={(e) => setSinalPago(e.target.checked)}
                    />
                    <span className="checkbox-label">
                      ✓ Confirmo o pagamento do sinal de R$ 20,00
                    </span>
                  </label>
                </div>
              </div>

              {/* Seção 6: Observação */}
              <div className="form-section">
                <h3>📝 Observações (Opcional)</h3>
                <div className="form-group">
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Digite qualquer observação sobre o serviço..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botão Submeter */}
              <button
                type="submit"
                className="btn-primary btn-submit"
                disabled={loading || cartItems.length === 0 || !selectedCustomer || !selectedDate || !selectedTime || !sinalPago}
              >
                {loading ? '⏳ Agendando...' : '✓ Agendar Serviço'}
              </button>
            </form>
          </div>

          {/* Resumo */}
          <div className="service-summary-section">
            <div className="summary-card">
              <h3>📊 Resumo do Agendamento</h3>

              {selectedCustomer && (
                <div className="summary-field">
                  <label>Cliente:</label>
                  <div className="summary-value">{selectedCustomer.name}</div>
                </div>
              )}

              {cartItems.length > 0 && (
                <>
                  <div className="summary-field">
                    <label>Serviços:</label>
                    <div className="summary-value">{cartItems.length} serviço(s)</div>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-items-list">
                    {cartItems.map(item => {
                      const discountedPrice = calculateDiscountedPrice(item)
                      return (
                      <div key={item.id} className="summary-item">
                        <span>{item.name} x {item.quantity}</span>
                        <span>R$ {(discountedPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      )
                    })}
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-total">
                    <span>Total:</span>
                    <span className="total-value">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </>
              )}

              {selectedDate && selectedTime && (
                <div className="summary-field">
                  <label>Agendamento:</label>
                  <div className="summary-value">
                    📅 {formatDateDisplay(selectedDate)}
                    <br />
                    🕐 {selectedTime}
                  </div>
                </div>
              )}

              {typePayment && cartItems.length > 0 && (
                <div className="summary-field">
                  <label>Pagamento:</label>
                  <div className="summary-value">
                    {typePayment === 'pix' && '🔷 Pix'}
                    {typePayment === 'dinheiro' && '💵 Dinheiro'}
                    {typePayment === 'cartao' && '💳 Cartão'}
                  </div>
                </div>
              )}

              {sinalPago && (
                <div className="summary-field">
                  <label>Sinal:</label>
                  <div className="summary-value sinal-confirmed">
                    ✓ R$ 20,00 confirmado
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Serviços */}
        {showItemsModal && (
          <div className="modal-overlay" onClick={() => setShowItemsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Selecione Serviços</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowItemsModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="modal-search">
                <input
                  type="text"
                  placeholder="🔍 Buscar serviço por nome..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="modal-search-input"
                />
              </div>

              <div className="modal-body">
                {filteredItems.length > 0 ? (
                  <div className="items-grid">
                    {filteredItems.map(item => {
                      const inCart = cartItems.find(ci => ci.id === item.id)
                      return (
                        <div
                          key={item.id}
                          className={`item-card ${inCart ? 'in-cart' : ''}`}
                        >
                          <div className="item-header">
                            <div className="item-name">{item.name}</div>
                            <div className="item-type-badge">✂️ Serviço</div>
                          </div>

                          <div className="item-description">
                            {item.description}
                          </div>

                          <div className="item-footer">
                            <div className="item-price">
                              {calculateDiscountedPrice(item) < item.price ? (
                                <>
                                  <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '0.5rem', fontSize: '0.85rem' }}>R$ {item.price.toFixed(2)}</span>
                                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>R$ {calculateDiscountedPrice(item).toFixed(2)}</span>
                                </>
                              ) : (
                                <span>R$ {item.price.toFixed(2)}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn-icon-add"
                              onClick={() => handleAddItemToCart(item)}
                              title="Adicionar"
                            >
                              {inCart ? '✓ Adicionado' : '+ Adicionar'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="empty-items">
                    Nenhum serviço encontrado
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ServiceScheduling
