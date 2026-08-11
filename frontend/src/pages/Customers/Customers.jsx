import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/layouts/MainLayout'
import CustomerController from '@/modules/customer/customer.controller'
import { validateCustomer } from '@/modules/customer/customer.dto'
import './Customers.css'

// Formatar data e hora
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida'
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  // Atualizar clientes
  const handleUpdateCustomers = useCallback(() => {
    console.log('Clientes atualizados:', CustomerController.customers)
    setCustomers([...CustomerController.customers])
  }, [])

  // Carregar clientes ao montar
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        await CustomerController.list()
        handleUpdateCustomers()
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()

    // Subscribe para atualizações
    const unsubscribe = CustomerController.subscribe(() => {
      handleUpdateCustomers()
    })

    return () => unsubscribe && unsubscribe()
  }, [handleUpdateCustomers])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSearch = async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    try {
      await CustomerController.list(value)
    } catch (err) {
      console.error('Erro ao buscar:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const validation = validateCustomer(formData)

      if (!validation.isValid) {
        setError(Object.values(validation.errors).join(', '))
        return
      }

      if (editingId) {
        await CustomerController.update(editingId, formData.name, formData.phone)
      } else {
        await CustomerController.create(formData.name, formData.phone)
      }

      setFormData({ name: '', phone: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Erro ao salvar cliente')
    }
  }

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await CustomerController.delete(id)
      } catch (err) {
        setError(err.message || 'Erro ao deletar cliente')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', phone: '' })
    setError(null)
  }

  return (
    <MainLayout>
      <div className="customers-container">
        <div className="customers-header">
          <h1>👥 Clientes</h1>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancelar' : '+ Novo Cliente'}
          </button>
        </div>

        {/* Barra de busca */}
        <div className="customers-search">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        {/* Erro */}
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {CustomerController.error && (
          <div className="alert alert-error">
            ⚠️ {CustomerController.error}
            <button onClick={() => CustomerController.clearError()} className="alert-close">✕</button>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="customers-form-container">
            <form onSubmit={handleSubmit} className="customers-form">
              <h3>{editingId ? 'Editar' : 'Novo'} Cliente</h3>

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
                <label htmlFor="phone">Telefone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={CustomerController.loading}>
                  {CustomerController.loading ? '⏳ Salvando...' : '✓ Salvar'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="customers-list-container">
          {loading ? (
            <div className="loading">⏳ Carregando clientes...</div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <p>{searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
              {!searchTerm && (
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  + Criar primeiro
                </button>
              )}
            </div>
          ) : (
            <div className="customers-table-wrapper">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Data de Criação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id}>
                      <td className="name-cell">
                        <strong>{customer.name}</strong>
                      </td>
                      <td className="phone-cell">
                        {customer.phone}
                      </td>
                      <td className="date-cell">
                        {formatDateTime(customer.createdAt)}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEdit(customer)}
                          title="Editar"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(customer.id)}
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
        <div className="customers-info">
          <p>Total de clientes: <strong>{customers.length}</strong></p>
        </div>
      </div>
    </MainLayout>
  )
}

export default Customers
