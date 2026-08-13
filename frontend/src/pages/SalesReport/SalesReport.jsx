import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/layouts/MainLayout'
import './SalesReport.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export default function SalesReport() {
  const [periodo, setPeriodo] = useState('mensal')
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const accessToken = localStorage.getItem('accessToken')

  const processarClientes = useCallback((orders) => {
    const today = new Date()
    const clientesMap = {}

    // Definir ranges de datas
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    const weekStart = new Date(todayStart)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)

    const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0))
    const monthEnd = new Date(monthStart)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0))
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1, 0, 0, 0))

    // Processar pedidos
    orders.forEach(o => {
      // Verificar se deve contar (produtos ou serviços finalizados)
      if (o.sinal === false || o.status === 'FINALIZADO') {
        const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)
        const cliente = o.customerId?.name || 'Cliente'
        const telefone = o.customerId?.phone || '-'
        const valor = o.total || 0

        // Verificar se está no período selecionado
        let incluir = false
        if (periodo === 'diario' && dataRef >= todayStart && dataRef < tomorrowStart) incluir = true
        if (periodo === 'semanal' && dataRef >= weekStart && dataRef < tomorrowStart) incluir = true
        if (periodo === 'mensal' && dataRef >= monthStart && dataRef < monthEnd) incluir = true
        if (periodo === 'anual' && dataRef >= yearStart && dataRef < yearEnd) incluir = true

        if (incluir) {
          if (!clientesMap[cliente]) {
            clientesMap[cliente] = { 
              nome: cliente, 
              telefone: telefone,
              total: 0, 
              transacoes: [], 
              pagamentos: { dinheiro: 0, cartao: 0, pix: 0 }
            }
          }
          clientesMap[cliente].total += valor
          clientesMap[cliente].transacoes.push({
            data: o.sinal === false ? new Date(o.createdAt).toLocaleDateString('pt-BR') : new Date(o.agenda).toLocaleDateString('pt-BR'),
            valor: valor,
            tipo: o.sinal === false ? 'Produto' : 'Serviço',
            pagamento: o.typePayment || 'dinheiro'
          })
          const tipoPagamento = o.typePayment || 'dinheiro'
          clientesMap[cliente].pagamentos[tipoPagamento] = (clientesMap[cliente].pagamentos[tipoPagamento] || 0) + 1
        }
      }
    })

    return Object.values(clientesMap).sort((a, b) => b.total - a.total)
  }, [periodo, selectedMonth, selectedYear])

  const processarProdutosServicos = useCallback((orders) => {
    const today = new Date()
    const itensMap = {}

    // Definir ranges de datas
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    const weekStart = new Date(todayStart)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)

    const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0))
    const monthEnd = new Date(monthStart)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0))
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1, 0, 0, 0))

    // Processar pedidos
    orders.forEach(o => {
      if ((o.sinal === false || o.status === 'FINALIZADO') && o.items && o.items.length > 0) {
        const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)

        // Verificar período
        let incluir = false
        if (periodo === 'diario' && dataRef >= todayStart && dataRef < tomorrowStart) incluir = true
        if (periodo === 'semanal' && dataRef >= weekStart && dataRef < tomorrowStart) incluir = true
        if (periodo === 'mensal' && dataRef >= monthStart && dataRef < monthEnd) incluir = true
        if (periodo === 'anual' && dataRef >= yearStart && dataRef < yearEnd) incluir = true

        if (incluir) {
          o.items.forEach(item => {
            const tipo = o.sinal === false ? 'Produto' : 'Serviço'
            // item.itemId é o objeto referenciado (populated)
            const itemName = (item.itemId?.name) || item.name || 'Item'
            const key = `${itemName}|${tipo}`
            
            if (!itensMap[key]) {
              itensMap[key] = { 
                nome: itemName, 
                tipo: tipo,
                quantidade: 0, 
                valorTotal: 0, 
                precoUnitario: item.precoUnitario 
              }
            }
            itensMap[key].quantidade += item.quantidade || 1
            itensMap[key].valorTotal += (item.precoUnitario || 0) * (item.quantidade || 1)
          })
        }
      }
    })

    return Object.values(itensMap).sort((a, b) => b.valorTotal - a.valorTotal)
  }, [periodo, selectedMonth, selectedYear])

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error('Erro ao buscar pedidos')

      const data = await response.json()
      const orders = Array.isArray(data) ? data : (data.data || data.orders || [])

      setClientes(processarClientes(orders))
      setProdutos(processarProdutosServicos(orders))
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken, processarClientes, processarProdutosServicos])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  const formatPhone = (phone) => {
    if (!phone || phone === '-') return '-'
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <MainLayout>
      <div className="salesreport-container">
        <div className="salesreport-header">
          <h1>Relatório de Vendas</h1>
        </div>

        {/* Filtro período */}
        <div className="filter-section">
          <div className="filter-buttons">
            {['diario', 'semanal', 'mensal', 'anual'].map(tipo => (
              <button
                key={tipo}
                className={`filter-btn ${periodo === tipo ? 'active' : ''}`}
                onClick={() => setPeriodo(tipo)}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>

          {periodo === 'mensal' && (
            <div className="filter-selects">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodo === 'anual' && (
            <div className="filter-selects">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="salesreport-grid">
          {/* Card 1: Top Clientes */}
          <div className="report-card">
            <div className="card-header">
              <h2>Clientes Top</h2>
            </div>
            <div className="card-content">
              {loading ? (
                <p>Carregando...</p>
              ) : clientes.length === 0 ? (
                <p className="empty">Nenhuma venda neste período</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ranking</th>
                      <th>Nome</th>
                      <th>Telefone</th>
                      <th>Total</th>
                      <th>Dinheiro</th>
                      <th>PIX</th>
                      <th>Cartão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.slice(0, 20).map((cliente, idx) => (
                      <tr key={idx}>
                        <td className="ranking-col">{idx + 1}º</td>
                        <td className="nome-col">{cliente.nome}</td>
                        <td className="telefone-col">{formatPhone(cliente.telefone)}</td>
                        <td className="total-col">{formatMoney(cliente.total)}</td>
                        <td className="payment-col">{cliente.pagamentos.dinheiro || '-'}</td>
                        <td className="payment-col">{cliente.pagamentos.pix || '-'}</td>
                        <td className="payment-col">{cliente.pagamentos.cartao || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card 2: Top Produtos/Serviços */}
          <div className="report-card">
            <div className="card-header">
              <h2>Mais Vendidos</h2>
            </div>
            <div className="card-content">
              {loading ? (
                <p>Carregando...</p>
              ) : produtos.length === 0 ? (
                <p className="empty">Nenhuma venda neste período</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ranking</th>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Unitário</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.slice(0, 20).map((item, idx) => (
                      <tr key={idx}>
                        <td className="ranking-col">{idx + 1}º</td>
                        <td className="nome-col">{item.nome}</td>
                        <td className="tipo-col">{item.tipo}</td>
                        <td className="qty-col">{item.quantidade}</td>
                        <td className="price-col">{formatMoney(item.precoUnitario || 0)}</td>
                        <td className="total-col">{formatMoney(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
