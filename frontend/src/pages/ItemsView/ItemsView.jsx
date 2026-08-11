import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/layouts/MainLayout'
import ItemController from '@/modules/item/item.controller'
import { ITEM_TYPE } from '@/modules/item/item.dto'
import './ItemsView.css'

export function ItemsView() {
  const [activeTab, setActiveTab] = useState(ITEM_TYPE.PRODUCT)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Atualizar itens baseado na tab ativa
  const handleUpdateItems = useCallback(() => {
    if (activeTab === ITEM_TYPE.PRODUCT) {
      setItems([...ItemController.products])
    } else {
      setItems([...ItemController.services])
    }
  }, [activeTab])

  // Carregar itens ao montar e subscrever
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

    // Subscribe para atualizações do controller
    const unsubscribe = ItemController.subscribe(() => {
      handleUpdateItems()
    })

    return () => unsubscribe && unsubscribe()
  }, [handleUpdateItems])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const getTabLabel = () => (activeTab === ITEM_TYPE.PRODUCT ? 'Produtos' : 'Serviços')
  const getTabIcon = () => (activeTab === ITEM_TYPE.PRODUCT ? '📦' : '🔧')

  return (
    <MainLayout>
      <div className="items-view-container">
        <div className="items-view-header">
          <h1>{getTabIcon()} {getTabLabel}</h1>
        </div>

        {/* Tabs */}
        <div className="items-view-tabs">
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

        {/* Lista de Itens */}
        <div className="items-view-grid">
          {loading ? (
            <div className="loading">⏳ Carregando itens...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum {activeTab === ITEM_TYPE.PRODUCT ? 'produto' : 'serviço'} disponível no momento</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <h3 className="item-name">{item.name}</h3>
                  {activeTab === ITEM_TYPE.PRODUCT && item.quantity > 0 && (
                    <span className="item-badge">{item.quantity} em estoque</span>
                  )}
                </div>

                <p className="item-description">{item.description || 'Sem descrição'}</p>

                <div className="item-card-footer">
                  <div className="item-price">
                    <span className="price-label">Preço</span>
                    <span className="price-value">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {item.discount?.percentual > 0 && (
                    <div className="item-discount">
                      <span className="discount-badge">{item.discount.percentual}% OFF</span>
                    </div>
                  )}
                </div>

                {activeTab === ITEM_TYPE.PRODUCT && (
                  <div className="item-stock-indicator">
                    {item.quantity === 0 ? (
                      <span className="out-of-stock">❌ Fora de estoque</span>
                    ) : item.quantity < 5 ? (
                      <span className="low-stock">⚠️ Pouco em estoque</span>
                    ) : (
                      <span className="in-stock">✅ Disponível</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info */}
        {items.length > 0 && (
          <div className="items-view-info">
            <p>Total de {activeTab === ITEM_TYPE.PRODUCT ? 'produtos' : 'serviços'}: <strong>{items.length}</strong></p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ItemsView
