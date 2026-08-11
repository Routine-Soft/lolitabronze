import  { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/layouts/MainLayout'
import ItemController from '@/modules/item/item.controller'
import { ITEM_TYPE, validateItem } from '@/modules/item/item.dto'
import './Items.css'

export function Items() {
  const [activeTab, setActiveTab] = useState(ITEM_TYPE.PRODUCT)
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ITEM_TYPE.PRODUCT,
    price: '',
    quantity: '',
    discount: {
      diasSemana: [],
      percentual: '',
    },
  })

  // Atualizar itens baseado na tab ativa (com activeTab como dependência)
  const handleUpdateItems = useCallback(() => {
    if (activeTab === ITEM_TYPE.PRODUCT) {
      setItems([...ItemController.products])
    } else {
      setItems([...ItemController.services])
    }
  }, [activeTab])

  // Inicializar e carregar itens
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        await ItemController.list()
        handleUpdateItems()
      } catch (err) {
        console.error('Erro ao carregar itens:', err)
      } finally {
        setLoading(false)
      }
    }

    loadItems()

    // Subscribe para atualizações do controller (com callback correto)
    const unsubscribe = ItemController.subscribe(() => {
      handleUpdateItems()
    })

    return () => unsubscribe && unsubscribe()
  }, [handleUpdateItems])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Atualizar itens imediatamente quando muda a tab
    if (tab === ITEM_TYPE.PRODUCT) {
      setItems(ItemController.products)
    } else {
      setItems(ItemController.services)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      type: tab,
      price: '',
      quantity: '',
      discount: {
        diasSemana: [],
        percentual: '',
      },
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDiscountChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      discount: {
        ...prev.discount,
        [name]: name === 'percentual' ? parseFloat(value) || '' : value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const validation = validateItem({
        ...formData,
        type: activeTab,
      })

      if (!validation.isValid) {
        setError(Object.values(validation.errors).join(', '))
        return
      }

      if (editingId) {
        await ItemController.update(
          editingId,
          formData.name,
          formData.description,
          activeTab,
          parseFloat(formData.price),
          activeTab === ITEM_TYPE.PRODUCT ? parseInt(formData.quantity) : null,
          formData.discount
        )
      } else {
        await ItemController.create(
          formData.name,
          formData.description,
          activeTab,
          parseFloat(formData.price),
          activeTab === ITEM_TYPE.PRODUCT ? parseInt(formData.quantity) : null,
          formData.discount
        )
      }

      // Resetar formulário
      setFormData({
        name: '',
        description: '',
        type: activeTab,
        price: '',
        quantity: '',
        discount: {
          diasSemana: [],
          percentual: '',
        },
      })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Erro ao salvar item')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      type: item.type,
      price: item.price.toString(),
      quantity: item.quantity ? item.quantity.toString() : '',
      discount: item.discount || {
        diasSemana: [],
        percentual: '',
      },
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este item?')) {
      try {
        await ItemController.delete(id)
      } catch (err) {
        setError(err.message || 'Erro ao deletar item')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      type: activeTab,
      price: '',
      quantity: '',
      discount: {
        diasSemana: [],
        percentual: '',
      },
    })
    setError(null)
  }

  const getTabLabel = () => (activeTab === ITEM_TYPE.PRODUCT ? 'Produtos' : 'Serviços')
  const getTabIcon = () => (activeTab === ITEM_TYPE.PRODUCT ? '📦' : '🔧')

  return (
    <MainLayout>
      <div className="items-container">
        <div className="items-header">
          <h1>{getTabIcon()} {getTabLabel}</h1>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancelar' : '+ Novo'}
          </button>
        </div>

        {/* Tabs */}
        <div className="items-tabs">
          <button
            className={`tab ${activeTab === ITEM_TYPE.PRODUCT ? 'active' : ''}`}
            onClick={() => handleTabChange(ITEM_TYPE.PRODUCT)}
          >
            📦 Produtos
          </button>
          <button
            className={`tab ${activeTab === ITEM_TYPE.SERVICE ? 'active' : ''}`}
            onClick={() => handleTabChange(ITEM_TYPE.SERVICE)}
          >
            🔧 Serviços
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {ItemController.error && (
          <div className="alert alert-error">
            ⚠️ {ItemController.error}
            <button onClick={() => ItemController.clearError()} className="alert-close">✕</button>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="items-form-container">
            <form onSubmit={handleSubmit} className="items-form">
              <h3>{editingId ? 'Editar' : 'Novo'} {activeTab === ITEM_TYPE.PRODUCT ? 'Produto' : 'Serviço'}</h3>

              <div className="form-group">
                <label htmlFor="name">Nome *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Digite o nome"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Digite uma descrição (opcional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Preço (R$) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {activeTab === ITEM_TYPE.PRODUCT && (
                  <div className="form-group">
                    <label htmlFor="quantity">Quantidade *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="percentual">Desconto (%) - Opcional</label>
                  <input
                    type="number"
                    id="percentual"
                    name="percentual"
                    value={formData.discount.percentual}
                    onChange={handleDiscountChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={ItemController.loading}>
                  {ItemController.loading ? '⏳ Salvando...' : '✓ Salvar'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="items-list-container">
          {loading ? (
            <div className="loading">⏳ Carregando itens...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum {activeTab === ITEM_TYPE.PRODUCT ? 'produto' : 'serviço'} cadastrado</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                + Criar primeiro
              </button>
            </div>
          ) : (
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th>Preço</th>
                    {activeTab === ITEM_TYPE.PRODUCT && <th>Qtd</th>}
                    <th>Desconto</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="name-cell">
                        <strong>{item.name}</strong>
                      </td>
                      <td className="description-cell">{item.description || '-'}</td>
                      <td className="price-cell">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </td>
                      {activeTab === ITEM_TYPE.PRODUCT && (
                        <td className="quantity-cell">
                          {item.quantity || 0}
                        </td>
                      )}
                      <td className="discount-cell">
                        {item.discount?.percentual ? `${item.discount.percentual}%` : '-'}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(item.id)}
                          title="Deletar"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="items-info">
          <p>Total de {activeTab === ITEM_TYPE.PRODUCT ? 'produtos' : 'serviços'}: <strong>{items.length}</strong></p>
        </div>
      </div>
    </MainLayout>
  )
}

export default Items
