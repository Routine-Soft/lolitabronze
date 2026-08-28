import { useCustomers } from "../customer.hooks";
import { useState } from "react";
import './CustomerADM.css';

export default function CustomerADM() {
  const {
    customers,
    loading,
    error,
    successMessage,
    search,
    addCustomer,
    editCustomer,
    removeCustomer,
    updateSearch,
  } = useCustomers(5);

  const [editingId, setEditingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function resetForm() {
    setName('');
    setPhone('');
    setEditingId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const customerData = { name, phone };

    if (editingId) {
      editCustomer(editingId, customerData);
    } else {
      addCustomer(customerData);
    }

    resetForm();
  }

  function startEditing(customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setIsEditModalOpen(true);
  }

  function handleClearSearch() {
    updateSearch('');
  }

  // if (loading) return <p>Carregando usuários...</p>;
  if (error) return <p>Error: {error.message}</p>;

return (
    <div className="customer-card">
      <div className="customer-header">
        <h2>Gestão de Clientes</h2>
      </div>

      {successMessage && <p className="customer-alert-success">{successMessage}</p>}

      <div className="customer-sections-container">
        {/* Formulário de Cadastro */}
        <section className="customer-section">
          <h3>Cadastrar Cliente</h3>
          <form onSubmit={handleSubmit} className="customer-form">
            <input
              type="text"
              className="customer-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
            />
            <input
              type="text"
              className="customer-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
            />
            <button type="submit" className="customer-btn-primary customer-btn-full">
              Cadastrar Cliente
            </button>
          </form>
        </section>

        {/* Lista de Clientes */}
        <section className="customer-section">
          <h3>Lista de Clientes</h3>
          <div className="customer-search-box">
            <input
              type="text"
              className="customer-input"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone"
            />
            <button type="button" className="customer-btn-secondary" onClick={handleClearSearch}>
              Limpar
            </button>
          </div>

          {loading && <p className="customer-loading">Carregando clientes...</p>}

          <ul className="customer-list">
            {customers.map((customer) => (
              <li key={customer.id} className="customer-item">
                <div className="customer-info">
                  <p className="customer-name">{customer.name}</p>
                  <p className="customer-phone">{customer.phone}</p>
                  <p className="customer-date">
                    Cadastrado em: {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="customer-item-actions">
                  <button className="customer-btn-edit" onClick={() => startEditing(customer)}>
                    Edit
                  </button>
                  <button className="customer-btn-delete" onClick={() => removeCustomer(customer.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Modal de Edição (Overlay fixo) */}
      {isEditModalOpen && (
        <div className="customer-modal-overlay">
          <div className="customer-modal">
            <h3>Editar Cliente</h3>

            <form onSubmit={handleSubmit} className="customer-form">
              <input
                type="text"
                className="customer-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
              />

              <input
                type="text"
                className="customer-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone"
              />

              <div className="customer-modal-actions">
                <button type="submit" className="customer-btn-primary">
                  Salvar
                </button>
                <button
                  type="button"
                  className="customer-btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}