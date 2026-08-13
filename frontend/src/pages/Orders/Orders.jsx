import { useState, useEffect } from 'react'
import MainLayout from '@/layouts/MainLayout'
import CustomerController from '@/modules/customer/customer.controller'
import ItemController from '@/modules/item/item.controller'
import OrderHistoryController from '@/modules/orderHistory/orderHistory.controller'
import UserController from '@/modules/user/user.controller'
import { validateOrder } from '@/modules/orderHistory/orderHistory.dto'
import './Orders.css'

export function Orders() {
  // Estados principais
  const [customers, setCustomers] = useState([])
  const [allProducts, setAllProducts] = useState([])

  // Formulário
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [cartItems, setCartItems] = useState([]) // Items adicionados ao pedido
  const [typePayment, setTypePayment] = useState('pix')
  const [observacao, setObservacao] = useState('')
  const [itemSearch, setItemSearch] = useState('')

  // UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showItemsModal, setShowItemsModal] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await CustomerController.list()
        await ItemController.list()
        setCustomers([...CustomerController.customers])
        // Filtrar apenas produtos
        const products = ItemController.items.filter(item => item.type === 'PRODUCT')
        setAllProducts(products)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe
    const unsubCustomers = CustomerController.subscribe(() => {
      setCustomers([...CustomerController.customers])
    })
    const unsubItems = ItemController.subscribe(() => {
      const products = ItemController.items.filter(item => item.type === 'PRODUCT')
      setAllProducts(products)
    })

    return () => {
      unsubCustomers && unsubCustomers()
      unsubItems && unsubItems()
    }
  }, [])

  // Filtrar clientes por busca
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers

  // Filtrar produtos por busca
  const filteredItems = allProducts.filter(item =>
    itemSearch.trim() === '' ||
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(itemSearch.toLowerCase())
  )

  // Calcular total do carrinho
  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
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
        setError('Adicione pelo menos um produto')
        return
      }

      // Verificar userId
      const currentUser = UserController.currentUser
      const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId
      
      if (!currentUserId) {
        setError('Erro: ID do usuário não encontrado. Faça login novamente.')
        return
      }

      // Produtos não requerem agendamento, então agenda é null
      // Sinal é false para produtos
      const orderData = {
        customerId: selectedCustomer.id,
        items: cartItems.map(item => ({
          itemId: item.itemId,
          quantidade: item.quantity,
        })),
        sinal: false,
        userId: currentUserId,
        typePayment,
        agenda: null,
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
        false,
        typePayment,
        null
      )

      setSuccess(
        order.numeroAtendimento
          ? `Serviço agendado com sucesso! Número: ${order.numeroAtendimento}`
          : `Produto(s) vendido(s) com sucesso!`
      )

      // Resetar formulário
      setSelectedCustomer(null)
      setCartItems([])
      setTypePayment('pix')
      setObservacao('')
      setCustomerSearch('')

      // Recarregar pedidos no controller
      await OrderHistoryController.list()
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err.message || 'Erro ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="orders-container">
        <div className="orders-header">
          <h1>🛍️ Registro de Vendas - Produtos</h1>
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

        <div className="orders-content">
          {/* Lado esquerdo: Formulário */}
          <div className="orders-form-section">
            <form onSubmit={handleSubmitOrder} className="orders-form">
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

              {/* Seção 2: Produtos */}
              <div className="form-section">
                <div className="section-header">
                  <h3>2️⃣ Selecione os Produtos</h3>
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
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-price">
                            R$ {item.price.toFixed(2)}
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
                          R$ {(item.price * item.quantity).toFixed(2)}
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
                    ))}
                  </div>
                ) : (
                  <div className="empty-cart">
                    Nenhum produto adicionado
                  </div>
                )}
              </div>

              {/* Seção 3: Tipo de Pagamento */}
              <div className="form-section">
                <h3>3️⃣ Tipo de Pagamento</h3>
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

              {/* Seção 4: Observação */}
              <div className="form-section">
                <h3>4️⃣ Observações (Opcional)</h3>
                <div className="form-group">
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Digite qualquer observação sobre o pedido..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botão Submeter */}
              <button
                type="submit"
                className="btn-primary btn-submit"
                disabled={loading || cartItems.length === 0 || !selectedCustomer}
              >
                {loading ? '⏳ Registrando...' : '✓ Registrar Venda'}
              </button>
            </form>
          </div>

          {/* Lado direito: Resumo */}
          <div className="orders-summary-section">
            <div className="summary-card">
              <h3>📊 Resumo do Pedido</h3>

              {selectedCustomer && (
                <div className="summary-field">
                  <label>Cliente:</label>
                  <div className="summary-value">{selectedCustomer.name}</div>
                </div>
              )}

              {cartItems.length > 0 && (
                <>
                  <div className="summary-field">
                    <label>Items:</label>
                    <div className="summary-value">{cartItems.length} item(s)</div>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-items-list">
                    {cartItems.map(item => (
                      <div key={item.id} className="summary-item">
                        <span>{item.name} x {item.quantity}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-total">
                    <span>Total:</span>
                    <span className="total-value">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </>
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
            </div>
          </div>
        </div>

        {/* Modal de Items */}
        {showItemsModal && (
          <div className="modal-overlay" onClick={() => setShowItemsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Selecione Produtos</h2>
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
                  placeholder="🔍 Buscar produtos por nome..."
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
                            <div className="item-type-badge">
                              🛍️ Produto
                            </div>
                          </div>

                          <div className="item-description">
                            {item.description}
                          </div>

                          <div className="item-footer">
                            <div className="item-price">
                              R$ {item.price.toFixed(2)}
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
                    Nenhum produto encontrado
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

export default Orders
