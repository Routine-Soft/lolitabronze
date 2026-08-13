import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/layouts/MainLayout'
import './CashReport.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export default function CashReport() {
  const [periodo, setPeriodo] = useState('mensal')
  const [faturamento, setFaturamento] = useState({
    diario: [],
    semanal: [],
    mensal: [],
    anual: [],
  })
  const [caixa, setCaixa] = useState({
    diario: [],
    semanal: [],
    mensal: [],
    anual: [],
  })
  const [pagamentos, setPagamentos] = useState({
    diario: { dinheiro: 0, cartao: 0, pix: 0 },
    semanal: { dinheiro: 0, cartao: 0, pix: 0 },
    mensal: { dinheiro: 0, cartao: 0, pix: 0 },
    anual: { dinheiro: 0, cartao: 0, pix: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const accessToken = localStorage.getItem('accessToken')

  const processarPagamentos = (movements) => {
    const today = new Date()
    const result = {
      diario: { dinheiro: 0, cartao: 0, pix: 0 },
      semanal: { dinheiro: 0, cartao: 0, pix: 0 },
      mensal: { dinheiro: 0, cartao: 0, pix: 0 },
      anual: { dinheiro: 0, cartao: 0, pix: 0 },
    }

    // DIÁRIO (hoje)
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    movements.forEach(m => {
      const createdAt = new Date(m.createdAt)
      if (createdAt >= todayStart && createdAt < tomorrowStart && m.typePayment) {
        result.diario[m.typePayment] = (result.diario[m.typePayment] || 0) + m.valor
      }
    })

    // SEMANAL (últimos 7 dias)
    const weekStart = new Date(todayStart)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)

    movements.forEach(m => {
      const createdAt = new Date(m.createdAt)
      if (createdAt >= weekStart && createdAt < tomorrowStart && m.typePayment) {
        result.semanal[m.typePayment] = (result.semanal[m.typePayment] || 0) + m.valor
      }
    })

    // MENSAL
    const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0))
    const monthEnd = new Date(monthStart)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

    movements.forEach(m => {
      const createdAt = new Date(m.createdAt)
      if (createdAt >= monthStart && createdAt < monthEnd && m.typePayment) {
        result.mensal[m.typePayment] = (result.mensal[m.typePayment] || 0) + m.valor
      }
    })

    // ANUAL
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0))
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1, 0, 0, 0))

    movements.forEach(m => {
      const createdAt = new Date(m.createdAt)
      if (createdAt >= yearStart && createdAt < yearEnd && m.typePayment) {
        result.anual[m.typePayment] = (result.anual[m.typePayment] || 0) + m.valor
      }
    })

    return result
  }

  const processarFaturamento = (orders) => {
    const today = new Date()
    const result = { diario: [], semanal: [], mensal: [], anual: [] }

    // DIÁRIO (hoje)
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    // Incluir: produtos (sinal: false) OU serviços finalizados (status: FINALIZADO)
    result.diario = orders.filter(o => {
      const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)
      return (o.sinal === false || o.status === 'FINALIZADO') && dataRef >= todayStart && dataRef < tomorrowStart
    }).map(o => ({
      data: o.sinal === false ? o.createdAt : o.agenda,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      total: o.total || 0,
    }))

    // SEMANAL (últimos 7 dias)
    const weekStart = new Date(todayStart)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)

    result.semanal = orders.filter(o => {
      const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)
      return (o.sinal === false || o.status === 'FINALIZADO') && dataRef >= weekStart && dataRef < tomorrowStart
    }).map(o => ({
      data: o.sinal === false ? o.createdAt : o.agenda,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      total: o.total || 0,
    }))

    // MENSAL
    const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0))
    const monthEnd = new Date(monthStart)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

    result.mensal = orders.filter(o => {
      const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)
      return (o.sinal === false || o.status === 'FINALIZADO') && dataRef >= monthStart && dataRef < monthEnd
    }).map(o => ({
      data: o.sinal === false ? o.createdAt : o.agenda,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      total: o.total || 0,
    }))

    // ANUAL
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0))
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1, 0, 0, 0))

    result.anual = orders.filter(o => {
      const dataRef = o.sinal === false ? new Date(o.createdAt) : new Date(o.agenda)
      return (o.sinal === false || o.status === 'FINALIZADO') && dataRef >= yearStart && dataRef < yearEnd
    }).map(o => ({
      data: o.sinal === false ? o.createdAt : o.agenda,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      total: o.total || 0,
    }))

    return result
  }

  const processarCaixa = (orders) => {
    const today = new Date()
    const result = { diario: [], semanal: [], mensal: [], anual: [] }

    // DIÁRIO (hoje)
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    result.diario = orders.filter(o => {
      const createdAt = new Date(o.createdAt)
      return createdAt >= todayStart && createdAt < tomorrowStart
    }).map(o => ({
      data: o.createdAt,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      sinal: o.sinal === false ? 0 : 20, // Produto não tem sinal
      complemento: o.sinal === false ? 0 : (o.status === 'FINALIZADO' ? ((o.total || 0) - 20) : 0),
      total: o.sinal === false ? (o.total || 0) : (o.status === 'FINALIZADO' ? (o.total || 0) : 20), // Produto: total, Serviço: sinal ou total se finalizado
    }))

    // SEMANAL
    const weekStart = new Date(todayStart)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)

    result.semanal = orders.filter(o => {
      const createdAt = new Date(o.createdAt)
      return createdAt >= weekStart && createdAt < tomorrowStart
    }).map(o => ({
      data: o.createdAt,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      sinal: o.sinal === false ? 0 : 20,
      complemento: o.sinal === false ? 0 : (o.status === 'FINALIZADO' ? ((o.total || 0) - 20) : 0),
      total: o.sinal === false ? (o.total || 0) : (o.status === 'FINALIZADO' ? (o.total || 0) : 20),
    }))

    // MENSAL
    const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0))
    const monthEnd = new Date(monthStart)
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

    result.mensal = orders.filter(o => {
      const createdAt = new Date(o.createdAt)
      return createdAt >= monthStart && createdAt < monthEnd
    }).map(o => ({
      data: o.createdAt,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      sinal: o.sinal === false ? 0 : 20,
      complemento: o.sinal === false ? 0 : (o.status === 'FINALIZADO' ? ((o.total || 0) - 20) : 0),
      total: o.sinal === false ? (o.total || 0) : (o.status === 'FINALIZADO' ? (o.total || 0) : 20),
    }))

    // ANUAL
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0))
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1, 0, 0, 0))

    result.anual = orders.filter(o => {
      const createdAt = new Date(o.createdAt)
      return createdAt >= yearStart && createdAt < yearEnd
    }).map(o => ({
      data: o.createdAt,
      cliente: o.customerId?.name || 'Cliente',
      numero: o.numeroAtendimento || 'Produto',
      sinal: o.sinal === false ? 0 : 20,
      complemento: o.sinal === false ? 0 : (o.status === 'FINALIZADO' ? ((o.total || 0) - 20) : 0),
      total: o.sinal === false ? (o.total || 0) : (o.status === 'FINALIZADO' ? (o.total || 0) : 20),
    }))

    return result
  }

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar pedidos
      const ordersResponse = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      if (!ordersResponse.ok) throw new Error('Erro ao buscar pedidos')
      const orders = await ordersResponse.json()
      const ordersArray = Array.isArray(orders) ? orders : (orders.data || orders.orders || [])

      // Organizar por períodos (processarFaturamento filtra produtos e serviços finalizados)
      const faturData = processarFaturamento(ordersArray)
      setFaturamento(faturData)

      // Organizar caixa (usando dados de orders com sinal)
      const caixaData = processarCaixa(ordersArray)
      setCaixa(caixaData)

      // Buscar movimentos de caixa para análise de pagamentos
      const movementsResponse = await fetch(`${API_URL}/cash/movements`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      const movements = movementsResponse.ok ? await movementsResponse.json() : []
      const movementsArray = Array.isArray(movements) ? movements : (movements.data || [])

      // Processar pagamentos por tipo
      const pagamentoData = processarPagamentos(movementsArray)
      setPagamentos(pagamentoData)
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [accessToken, selectedMonth, selectedYear])

  useEffect(() => {
    loadReports()
  }, [loadReports, selectedMonth, selectedYear])

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const calcularTotalFaturamento = () => {
    return faturamento[periodo].reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const calcularTotalCaixa = () => {
    return caixa[periodo].reduce((sum, item) => sum + (item.sinal || 0), 0)
  }

  const calcularTotalComplemento = () => {
    return caixa[periodo].reduce((sum, item) => sum + (item.complemento || 0), 0)
  }

  const calcularTotalCaixaGeral = () => {
    return caixa[periodo].reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const calcularTotalPagamento = () => {
    return (pagamentos[periodo]?.dinheiro || 0) + (pagamentos[periodo]?.cartao || 0) + (pagamentos[periodo]?.pix || 0)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="cash-report-container">
          <h1>📊 Relatório de Caixa</h1>
          <p>Carregando dados...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="cash-report-container">
        <div className="report-header">
          <h1>📊 Relatório de Caixa</h1>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {/* Filtros */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Período:</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="filter-select">
              <option value="diario">📅 Diário</option>
              <option value="semanal">📆 Semanal</option>
              <option value="mensal">📊 Mensal</option>
              <option value="anual">📈 Anual</option>
            </select>
          </div>

          {periodo === 'mensal' && (
            <>
              <div className="filter-group">
                <label>Mês:</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="filter-select">
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Ano:</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="filter-select">
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </>
          )}

          {periodo === 'anual' && (
            <div className="filter-group">
              <label>Ano:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="filter-select">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          )}
        </div>

        <div className="reports-grid">
          {/* Faturamento */}
          <div className="report-section">
            <div className="report-title">
              <h2>💰 Faturamento</h2>
              <div className="report-total">
                {formatMoney(calcularTotalFaturamento())}
              </div>
            </div>

            <div className="report-list">
              {faturamento[periodo].length === 0 ? (
                <p className="empty-state">Nenhum faturamento para este período</p>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faturamento[periodo].map((item, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(item.data)}</td>
                        <td>#{item.numero}</td>
                        <td>{item.cliente}</td>
                        <td className="valor">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Caixa */}
          <div className="report-section">
            <div className="report-title">
              <h2>🔐 Caixa</h2>
              <div className="report-totals-box">
                <div className="report-subtotal">
                  <span>Sinal:</span>
                  <span>{formatMoney(calcularTotalCaixa())}</span>
                </div>
                <div className="report-subtotal">
                  <span>Complemento:</span>
                  <span>{formatMoney(calcularTotalComplemento())}</span>
                </div>
                <div className="report-total">
                  <span>Total:</span>
                  <span>{formatMoney(calcularTotalCaixaGeral())}</span>
                </div>
              </div>
            </div>

            <div className="report-list">
              {caixa[periodo].length === 0 ? (
                <p className="empty-state">Nenhum movimento de caixa para este período</p>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Sinal</th>
                      <th>Complemento</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caixa[periodo].map((item, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(item.data)}</td>
                        <td>#{item.numero}</td>
                        <td>{item.cliente}</td>
                        <td className="valor">{formatMoney(item.sinal)}</td>
                        <td className="valor">{formatMoney(item.complemento)}</td>
                        <td className="valor total">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="report-section">
            <div className="report-title">
              <h2>💳 Forma de Pagamento</h2>
              <div className="report-total">
                {formatMoney(calcularTotalPagamento())}
              </div>
            </div>

            <div className="report-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
              {/* Dinheiro */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#E8F5E9',
                borderLeft: '4px solid #4CAF50',
                borderRadius: '6px',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#2E7D32' }}>💵 Dinheiro</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#4CAF50' }}>
                  {formatMoney(pagamentos[periodo]?.dinheiro || 0)}
                </p>
              </div>

              {/* Cartão */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#E3F2FD',
                borderLeft: '4px solid #2196F3',
                borderRadius: '6px',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#1565C0' }}>💳 Cartão</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#2196F3' }}>
                  {formatMoney(pagamentos[periodo]?.cartao || 0)}
                </p>
              </div>

              {/* PIX */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#F3E5F5',
                borderLeft: '4px solid #9C27B0',
                borderRadius: '6px',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#6A1B9A' }}>📱 PIX</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#9C27B0' }}>
                  {formatMoney(pagamentos[periodo]?.pix || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
