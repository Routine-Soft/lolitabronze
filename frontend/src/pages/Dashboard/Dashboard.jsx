import { useState, useEffect, useCallback } from 'react'
// import { useAuthContext } from '@/hooks/useAuthContext'
import MainLayout from '@/layouts/MainLayout'
import { CustomersModal } from '@/pages/Customers/CustomersModal'
import { OrdersModal } from '@/pages/Orders/OrdersModal'
import { ServiceSchedulingModal } from '@/pages/ServiceScheduling/ServiceSchedulingModal'
import { printOrder } from '@/utils/printHelper'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export default function Dashboard() {
//   const { currentUser } = useAuthContext()
  
  // Estados
  const [agendaDia, setAgendaDia] = useState([])
  const [caixaDia, setCaixaDia] = useState(null)
  const [sessionCaixa, setSessionCaixa] = useState(null)
  const [faturamento, setFaturamento] = useState({
    diario: 0,
    semanal: 0,
    mensal: 0,
    anual: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroFaturamento, setFiltroFaturamento] = useState('mensal')
  const [showModalConcluir, setShowModalConcluir] = useState(false)
  const [agendaSelecionada, setAgendaSelecionada] = useState(null)
  const [loadingConcluir, setLoadingConcluir] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro')
  const [loadingCaixa, setLoadingCaixa] = useState(false)
  const [valorAbertura, setValorAbertura] = useState('')
  const [showModalAbrirCaixa, setShowModalAbrirCaixa] = useState(false)
  const [valorFechamento, setValorFechamento] = useState('')
  const [showModalFecharCaixa, setShowModalFecharCaixa] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showServiceSchedulingModal, setShowServiceSchedulingModal] = useState(false)
  const [dataAgendaSelecionada, setDataAgendaSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )

  const accessToken = localStorage.getItem('accessToken')

  // ====== FUNÇÕES DE CARREGAMENTO (com useCallback) ======

  // const loadAgendaDia = useCallback(async () => {
  //   try {
  //     const response = await fetch(`${API_URL}/orders`, {
  //       headers: { 'Authorization': `Bearer ${accessToken}` },
  //     })

  //     if (!response.ok) throw new Error('Erro ao buscar agenda')

  //     const data = await response.json()
  //     console.log('Dados da agenda:', data)
      
  //     // A API pode retornar array direto ou dentro de um objeto
  //     const orders = Array.isArray(data) ? data : (data.data || data.orders || [])
      
  //     const today = new Date()
  //     const todayStr = today.toLocaleDateString('pt-BR')  // "12/08/2026"
      
  //     const agenda = orders
  //       .filter(o => {
  //         // Se não tem agenda ou numeroAtendimento, descarta
  //         if (!o.agenda || !o.numeroAtendimento) return false
          
  //         // Comparar com o campo "dia" que já vem em formato local
  //         return o.dia === todayStr
  //       })
  //       .sort((a, b) => new Date(a.agenda) - new Date(b.agenda))

  //     setAgendaDia(agenda)
  //   } catch (err) {
  //     console.error('Erro ao carregar agenda:', err)
  //     setAgendaDia([])
  //   }
  // }, [accessToken])

  const loadAgendaDia = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar agenda')
      }

      const data = await response.json()

      const orders = Array.isArray(data)
        ? data
        : (data.data || data.orders || [])

      // Data escolhida no calendário
      const [ano, mes, dia] = dataAgendaSelecionada
        .split('-')
        .map(Number)

      const dataSelecionada = new Date(ano, mes - 1, dia)

      const dataSelecionadaStr = dataSelecionada.toLocaleDateString('pt-BR')

      const agenda = orders
        .filter(o => {
          // Só mostra pedidos que possuem agendamento
          if (!o.agenda || !o.numeroAtendimento) {
            return false
          }

          // O backend já envia "dia" no formato DD/MM/YYYY
          return o.dia === dataSelecionadaStr
        })
        .sort((a, b) => {
          return new Date(a.agenda) - new Date(b.agenda)
        })

      setAgendaDia(agenda)

    } catch (err) {
      console.error('Erro ao carregar agenda:', err)
      setAgendaDia([])
    }
  }, [accessToken, dataAgendaSelecionada])

  const loadCaixaDia = useCallback(async () => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!response.ok) throw new Error('Erro ao buscar caixa')

    const data = await response.json()

    const orders = Array.isArray(data)
      ? data
      : (data.data || data.orders || [])

    // ==========================================
    // DATA DE HOJE — HORÁRIO LOCAL
    // ==========================================
    const hoje = new Date()

    const hojeStr = hoje.toLocaleDateString('pt-BR')

    let totalEntradas = 0

    orders.forEach(o => {

      // ==========================================
      // 1. PRODUTOS
      // ==========================================
      // Produtos não possuem sinal.
      // O valor inteiro entra no caixa no dia da compra.
      if (o.sinal === false) {
        const createdAt = new Date(o.createdAt)

        const createdAtStr = createdAt.toLocaleDateString('pt-BR')

        if (createdAtStr === hojeStr) {
          totalEntradas += Number(o.total) || 0
        }
      }


      // ==========================================
      // 2. SINAL DE SERVIÇO
      // ==========================================
      // O sinal de R$20 entra no caixa no dia
      // em que o agendamento foi criado.
      if (o.sinal === true) {
        const createdAt = new Date(o.createdAt)

        const createdAtStr = createdAt.toLocaleDateString('pt-BR')

        if (createdAtStr === hojeStr) {
          totalEntradas += 20
        }
      }


      // ==========================================
      // 3. COMPLEMENTO DO SERVIÇO
      // ==========================================
      // O complemento entra no caixa no dia
      // em que o serviço foi FINALIZADO.
      if (
        o.status === 'FINALIZADO' &&
        o.dataFinalizacao
      ) {
        const dataFinalizacao = new Date(o.dataFinalizacao)

        const dataFinalizacaoStr =
          dataFinalizacao.toLocaleDateString('pt-BR')

        if (dataFinalizacaoStr === hojeStr) {

          const sinal = o.sinal ? 20 : 0

          const complemento =
            (Number(o.total) || 0) - sinal

          if (complemento > 0) {
            totalEntradas += complemento
          }
        }
      }
    })

    setCaixaDia({
      totalEntradas,
      totalSaidas: 0,
      saldo: totalEntradas,
    })

  } catch (err) {
    console.error('Erro ao carregar caixa:', err)

    setCaixaDia({
      totalEntradas: 0,
      totalSaidas: 0,
      saldo: 0,
    })
  }
}, [accessToken])

  const loadFaturamento = useCallback(async () => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar faturamento')
    }

    const data = await response.json()

    const orders = Array.isArray(data)
      ? data
      : (data.data || data.orders || [])

    const hoje = new Date()

    // ==========================================
    // FUNÇÃO PARA PEGAR APENAS A DATA LOCAL
    // ==========================================
    const getDateKey = (date) => {
      const d = new Date(date)

      if (isNaN(d.getTime())) {
        return null
      }

      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const hojeKey = getDateKey(hoje)

    // ==========================================
    // INÍCIO DA SEMANA
    // ==========================================
    const weekStart = new Date(hoje)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - 7)

    const fatura = {
      diario: 0,
      semanal: 0,
      mensal: 0,
      anual: 0,
    }

    // ==========================================
    // PROCESSAR PEDIDOS
    // ==========================================
    orders.forEach(o => {

      let dataReferencia = null

      // ==========================================
      // PRODUTOS
      // ==========================================
      // Produto:
      // faturamento = data da compra
      // valor = total do pedido
      if (o.sinal === false) {

        dataReferencia = new Date(o.createdAt)
      }


      // ==========================================
      // SERVIÇOS
      // ==========================================
      // Serviço:
      // só entra no faturamento quando FINALIZADO
      // faturamento = data da agenda
      // valor = total completo
      if (
        o.sinal === true &&
        o.status === 'FINALIZADO' &&
        o.agenda
      ) {

        dataReferencia = new Date(o.agenda)
      }


      // Se não tiver data válida, ignora
      if (
        !dataReferencia ||
        isNaN(dataReferencia.getTime())
      ) {
        return
      }

      const valor = Number(o.total) || 0

      // ==========================================
      // DIÁRIO
      // ==========================================
      const dataKey = getDateKey(dataReferencia)

      if (dataKey === hojeKey) {
        fatura.diario += valor
      }


      // ==========================================
      // SEMANAL
      // ==========================================
      if (dataReferencia >= weekStart && dataReferencia <= hoje) {
        fatura.semanal += valor
      }


      // ==========================================
      // MENSAL
      // ==========================================
      if (
        dataReferencia.getFullYear() === hoje.getFullYear() &&
        dataReferencia.getMonth() === hoje.getMonth()
      ) {
        fatura.mensal += valor
      }


      // ==========================================
      // ANUAL
      // ==========================================
      if (
        dataReferencia.getFullYear() === hoje.getFullYear()
      ) {
        fatura.anual += valor
      }
    })

    console.log('Faturamento calculado:', fatura)

    setFaturamento(fatura)

  } catch (err) {

    console.error('Erro ao carregar faturamento:', err)

    setFaturamento({
      diario: 0,
      semanal: 0,
      mensal: 0,
      anual: 0,
    })
  }
}, [accessToken])

  const loadSessionCaixa = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/cash/current`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSessionCaixa(data)
      } else {
        setSessionCaixa(null)
      }
    } catch (err) {
      console.error('Erro ao carregar sessão de caixa:', err)
      setSessionCaixa(null)
    }
  }, [accessToken])

  const handleAbrirCaixa = async () => {
    const valor = parseFloat(valorAbertura) || 0
    
    setLoadingCaixa(true)
    try {
      const response = await fetch(`${API_URL}/cash/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valorAbertura: valor,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao abrir caixa' }))
        throw new Error(error.message || 'Erro ao abrir caixa')
      }

      setValorAbertura('')
      setShowModalAbrirCaixa(false)
      await loadSessionCaixa()
    } catch (err) {
      console.error('Erro ao abrir caixa:', err)
      alert('Erro ao abrir caixa: ' + err.message)
    } finally {
      setLoadingCaixa(false)
    }
  }

  const handleFecharCaixa = async () => {
    if (!sessionCaixa || !sessionCaixa.id) return

    const valor = parseFloat(valorFechamento) || 0

    setLoadingCaixa(true)
    try {
      const response = await fetch(`${API_URL}/cash/${sessionCaixa.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valorFechamentoContado: valor,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao fechar caixa' }))
        throw new Error(error.message || 'Erro ao fechar caixa')
      }

      setValorFechamento('')
      setShowModalFecharCaixa(false)
      setSessionCaixa(null)
      await loadCaixaDia()
    } catch (err) {
      console.error('Erro ao fechar caixa:', err)
      alert('Erro ao fechar caixa: ' + err.message)
    } finally {
      setLoadingCaixa(false)
    }
  }

  // ====== USEEFFECTS ======

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted) return

      try {
        setLoading(true)
        setError(null)
        await loadSessionCaixa()
        await loadAgendaDia()
        await loadCaixaDia()
        await loadFaturamento()
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
        if (isMounted) {
          setError('Erro ao carregar dados do dashboard')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [loadSessionCaixa, loadAgendaDia, loadCaixaDia, loadFaturamento])

  useEffect(() => {
    if (!loading) {
      let isMounted = true

      const fetchFaturamento = async () => {
        if (!isMounted) return
        await loadFaturamento()
      }

      fetchFaturamento()

      return () => {
        isMounted = false
      }
    }
  }, [filtroFaturamento, loadFaturamento, loading])

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  const formatDateTime = (date) => {
    if (!date) return ''
    
    // Se vier como string formatada "12/08/2026, 09:00", retorna direto
    if (typeof date === 'string' && date.includes(',')) {
      return date
    }
    
    // Senão, faz o parse normal
    return new Date(date).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatName = (text, maxLength = 20) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Concluir serviço e finalizar pagamento
  const handleConcluirServico = async () => {
    if (!agendaSelecionada) return

    setLoadingConcluir(true)
    try {
      const response = await fetch(`${API_URL}/orders/${agendaSelecionada.id}/finalizar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          typePayment: metodoPagamento,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao finalizar serviço' }))
        throw new Error(error.message || 'Erro ao finalizar serviço')
      }

      // Imprimir recibo (fire and forget - não bloqueia)
      printOrder(agendaSelecionada.id || agendaSelecionada._id)

      // Recarregar dados
      await loadAgendaDia()
      await loadCaixaDia()
      await loadFaturamento()

      // Mostrar mensagem de sucesso
      setSuccessMessage('✓ Pagamento confirmado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)

      setShowModalConcluir(false)
      setAgendaSelecionada(null)
      setMetodoPagamento('dinheiro')
    } catch (err) {
      console.error('Erro ao concluir serviço:', err)
      alert('Erro ao concluir serviço: ' + err.message)
    } finally {
      setLoadingConcluir(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p>Carregando dados...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        {successMessage && (
          <div className="success-message" style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#4CAF50',
            color: '#FFF',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            animation: 'fadeIn 0.3s ease-in',
          }}>
            {successMessage}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-grid">
          {/* Widget 1: Agenda do Dia */}
          <div className="widget agenda-widget">
            <div className="widget-header">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <h2 style={{ margin: 0 }}>
                  📅 Agenda
                </h2>

                <input
                  type="date"
                  value={dataAgendaSelecionada}
                  onChange={(e) => setDataAgendaSelecionada(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <span className="badge">{agendaDia.length}</span>
            </div>

            <div className="widget-content">
              {agendaDia.length === 0 ? (
                <p className="empty-state">Nenhum serviço agendado para hoje</p>
              ) : (
                <div className="agenda-list">
                  {agendaDia.map((agenda, idx) => {
                    const isFinalizado = agenda.status === 'FINALIZADO'
                    const isAgendado = agenda.status === 'AGENDADO'
                    const isCancelado = agenda.status === 'CANCELADO'
                    return (
                    <div
                      key={idx}
                      className="agenda-item"
                      onClick={() => {
                        if (isAgendado) {
                          setAgendaSelecionada(agenda)
                          setShowModalConcluir(true)
                        }
                      }}
                      style={{ 
                        cursor: isAgendado ? 'pointer' : 'default',
                        opacity: isAgendado ? 1 : 0.7,
                      }}
                    >
                      <div className="agenda-time">
                        <strong>{formatDateTime(agenda.agenda)}</strong>
                      </div>
                      <div className="agenda-service">
                        #{agenda.numeroAtendimento}
                      </div>
                      <div className="agenda-client">
                        {formatName(agenda.customerId?.name || 'Cliente', 20)}
                      </div>
                      <span
                        className="status-badge"
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          backgroundColor:
                            isFinalizado
                              ? '#4CAF50'
                              : isCancelado
                                ? '#F44336'
                                : '#FFD700',
                          color: isFinalizado || isCancelado ? '#FFF' : '#000',
                        }}
                      >
                        {isFinalizado
                          ? '✓ Pago'
                          : isCancelado
                            ? '✕ Cancelado'
                            : '⏳ Pendente'}
                      </span>
                      <div className="agenda-price">
                        {formatMoney(agenda.total)}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Widget: Sessão de Caixa */}
          <div className="widget sessao-caixa-widget">
            <div className="widget-header">
              <h2>🔐 Sessão de Caixa</h2>
              {sessionCaixa && (
                <span className="badge status-aberto">✓ Aberto</span>
              )}
              {!sessionCaixa && (
                <span className="badge status-fechado">✗ Fechado</span>
              )}
            </div>

            <div className="widget-content">
              {sessionCaixa ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ color: '#DFAF2B', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Caixa aberto para hoje
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#999' }}>
                    ID: {sessionCaixa.id?.substring(0, 8)}...
                  </p>
                  <button
                    onClick={() => setShowModalFecharCaixa(true)}
                    disabled={loadingCaixa}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '1rem',
                      backgroundColor: '#D32F2F',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loadingCaixa ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: loadingCaixa ? 0.6 : 1,
                    }}
                  >
                    {loadingCaixa ? '⏳ Fechando...' : '✗ Fechar Caixa'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ color: '#999', marginBottom: '1rem' }}>
                    Nenhuma sessão aberta
                  </p>
                  <button
                    onClick={() => setShowModalAbrirCaixa(true)}
                    disabled={loadingCaixa}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#4CAF50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loadingCaixa ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      opacity: loadingCaixa ? 0.6 : 1,
                    }}
                  >
                    {loadingCaixa ? '⏳ Abrindo...' : '✓ Abrir Caixa'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>
                    ⚠️ Abra o caixa antes de finalizar serviços
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Caixa do Dia */}
          <div className="widget caixa-widget">
            <div className="widget-header">
              <h2>💰 Caixa do Dia</h2>
            </div>

            <div className="widget-content">
              {caixaDia === null ? (
                <p className="empty-state">Carregando dados do caixa...</p>
              ) : (
                <div className="caixa-summary">
                  <div className="caixa-item entrada">
                    <span className="label">📥 Entradas</span>
                    <span className="value">{formatMoney(caixaDia.totalEntradas)}</span>
                  </div>

                  <div className="caixa-item saida">
                    <span className="label">📤 Saídas</span>
                    <span className="value">{formatMoney(caixaDia.totalSaidas)}</span>
                  </div>

                  <div className="caixa-item saldo">
                    <span className="label">✅ Saldo</span>
                    <span className="value">{formatMoney(caixaDia.saldo)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 3: Faturamento */}
          <div className="widget faturamento-widget">
            <div className="widget-header">
              <h2>📈 Faturamento</h2>
            </div>

            <div className="widget-content">
              <div className="filter-buttons">
                {['diario', 'semanal', 'mensal', 'anual'].map(tipo => (
                  <button
                    key={tipo}
                    className={`filter-btn ${filtroFaturamento === tipo ? 'active' : ''}`}
                    onClick={() => setFiltroFaturamento(tipo)}
                  >
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </button>
                ))}
              </div>

              <div className="faturamento-display">
                <div className="faturamento-value">
                  {formatMoney(faturamento[filtroFaturamento])}
                </div>
                <p className="faturamento-label">
                  {filtroFaturamento === 'diario' && '(Hoje)'}
                  {filtroFaturamento === 'semanal' && '(Últimos 7 dias)'}
                  {filtroFaturamento === 'mensal' && '(Este mês)'}
                  {filtroFaturamento === 'anual' && '(Este ano)'}
                </p>
              </div>
            </div>

            <div className="widget-footer">
              <a href="/orders" className="btn-link">Ver Pedidos →</a>
            </div>
          </div>

          {/* Quick Actions - Modais */}
          <div className="widget quick-actions-widget">
            <div className="widget-header">
              <h2>⚡ Ações Rápidas</h2>
            </div>

            <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCustomersModal(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#8414D1',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                👥 Clientes
              </button>

              <button
                onClick={() => setShowOrdersModal(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#8414D1',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                🛍️ Venda de Produtos
              </button>

              <button
                onClick={() => setShowServiceSchedulingModal(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#8414D1',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                📅 Agendamento de Serviços
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Abrir Caixa */}
        {showModalAbrirCaixa && (
          <div className="modal-overlay-dashboard" onClick={() => !loadingCaixa && setShowModalAbrirCaixa(false)}>
            <div className="modal-content-dashboard" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-dashboard">
                <h2>✓ Abrir Caixa</h2>
                <button
                  className="modal-close-dashboard"
                  onClick={() => !loadingCaixa && setShowModalAbrirCaixa(false)}
                  disabled={loadingCaixa}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-dashboard">
                <div className="payment-info">
                  <p className="payment-label">Valor Inicial do Caixa:</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorAbertura}
                    onChange={(e) => setValorAbertura(e.target.value)}
                    disabled={loadingCaixa}
                    placeholder="0,00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '2px solid #8414D1',
                      backgroundColor: '#FFFFFF',
                      color: '#05030A',
                      fontSize: '1rem',
                      fontWeight: '500',
                    }}
                  />
                  <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                    Digite o valor em dinheiro que você está colocando no caixa agora
                  </p>
                </div>
              </div>

              <div className="modal-footer-dashboard">
                <button
                  className="btn-cancel"
                  onClick={() => !loadingCaixa && setShowModalAbrirCaixa(false)}
                  disabled={loadingCaixa}
                >
                  Cancelar
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleAbrirCaixa}
                  disabled={loadingCaixa}
                >
                  {loadingCaixa ? '⏳ Abrindo...' : '✓ Abrir Caixa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Fechar Caixa */}
        {showModalFecharCaixa && (
          <div className="modal-overlay-dashboard" onClick={() => !loadingCaixa && setShowModalFecharCaixa(false)}>
            <div className="modal-content-dashboard" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-dashboard">
                <h2>✗ Fechar Caixa</h2>
                <button
                  className="modal-close-dashboard"
                  onClick={() => !loadingCaixa && setShowModalFecharCaixa(false)}
                  disabled={loadingCaixa}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-dashboard">
                <div className="payment-info">
                  <p className="payment-label">Valor Total em Dinheiro:</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorFechamento}
                    onChange={(e) => setValorFechamento(e.target.value)}
                    disabled={loadingCaixa}
                    placeholder="0,00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '2px solid #8414D1',
                      backgroundColor: '#FFFFFF',
                      color: '#05030A',
                      fontSize: '1rem',
                      fontWeight: '500',
                    }}
                  />
                  <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                    Digite o valor total em dinheiro que você está sacando do caixa
                  </p>
                </div>
              </div>

              <div className="modal-footer-dashboard">
                <button
                  className="btn-cancel"
                  onClick={() => !loadingCaixa && setShowModalFecharCaixa(false)}
                  disabled={loadingCaixa}
                >
                  Cancelar
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleFecharCaixa}
                  disabled={loadingCaixa}
                >
                  {loadingCaixa ? '⏳ Fechando...' : '✗ Fechar Caixa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Conclusão de Pagamento */}
        {showModalConcluir && agendaSelecionada && (
          <div className="modal-overlay-dashboard" onClick={() => !loadingConcluir && setShowModalConcluir(false)}>
            <div className="modal-content-dashboard" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-dashboard">
                <h2>✓ Concluir Serviço</h2>
                <button
                  className="modal-close-dashboard"
                  onClick={() => !loadingConcluir && setShowModalConcluir(false)}
                  disabled={loadingConcluir}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-dashboard">
                <div className="payment-info">
                  <p className="payment-label">Cliente:</p>
                  <p className="payment-value">{agendaSelecionada.customerId?.name || 'Cliente'}</p>

                  <p className="payment-label" style={{ marginTop: '1rem' }}>Número de Atendimento:</p>
                  <p className="payment-value">#{agendaSelecionada.numeroAtendimento}</p>

                  <p className="payment-label" style={{ marginTop: '1rem' }}>Valor Total:</p>
                  <p className="payment-value">{formatMoney(agendaSelecionada.total)}</p>

                  <p className="payment-label" style={{ marginTop: '1rem' }}>Sinal Pago:</p>
                  <p className="payment-value">R$ 20,00 ✓</p>

                  <div className="payment-divider"></div>

                  <p className="payment-label">Complemento a Pagar:</p>
                  <p className="payment-value-complemento">
                    {formatMoney((agendaSelecionada.total || 0) - 20)}
                  </p>
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <label htmlFor="metodo-pagamento" className="payment-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    💳 Método de Pagamento:
                  </label>
                  <select
                    id="metodo-pagamento"
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                    disabled={loadingConcluir}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '2px solid #8414D1',
                      backgroundColor: '#FFFFFF',
                      color: '#05030A',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: loadingConcluir ? 'not-allowed' : 'pointer',
                      opacity: loadingConcluir ? 0.6 : 1,
                    }}
                  >
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="pix">📱 PIX</option>
                    <option value="cartao">💳 Cartão</option>
                  </select>
                </div>

                <div className="modal-warning">
                  <p>
                    ⚠️ Ao confirmar, o pagamento do complemento será registrado como {
                      metodoPagamento === 'dinheiro' ? '💵 Dinheiro' :
                      metodoPagamento === 'pix' ? '📱 PIX' : '💳 Cartão'
                    } e o serviço entrará no faturamento.
                  </p>
                </div>
              </div>

              <div className="modal-footer-dashboard">
                <button
                  className="btn-cancel"
                  onClick={() => !loadingConcluir && setShowModalConcluir(false)}
                  disabled={loadingConcluir}
                >
                  Cancelar
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleConcluirServico}
                  disabled={loadingConcluir}
                >
                  {loadingConcluir ? '⏳ Finalizando...' : '✓ Confirmar Pagamento'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Clientes */}
        {showCustomersModal && (
          <div className="modal-overlay-fullscreen" onClick={() => setShowCustomersModal(false)}>
            <div className="modal-content-fullscreen" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close-fullscreen"
                onClick={() => setShowCustomersModal(false)}
              >
                ✕
              </button>
              <CustomersModal onClose={() => setShowCustomersModal(false)} />
            </div>
          </div>
        )}

        {/* Modal: Vendas de Produtos */}
        {showOrdersModal && (
          <div className="modal-overlay-fullscreen" onClick={() => setShowOrdersModal(false)}>
            <div className="modal-content-fullscreen" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close-fullscreen"
                onClick={() => setShowOrdersModal(false)}
              >
                ✕
              </button>
              <OrdersModal onClose={() => setShowOrdersModal(false)} />
            </div>
          </div>
        )}

        {/* Modal: Agendamento de Serviços */}
        {showServiceSchedulingModal && (
          <div className="modal-overlay-fullscreen" onClick={() => setShowServiceSchedulingModal(false)}>
            <div className="modal-content-fullscreen" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close-fullscreen"
                onClick={() => setShowServiceSchedulingModal(false)}
              >
                ✕
              </button>
              <ServiceSchedulingModal onClose={() => setShowServiceSchedulingModal(false)} />
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .modal-overlay-fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }
          
          .modal-content-fullscreen {
            position: relative;
            background: #FFF;
            border-radius: 12px;
            width: 100%;
            max-width: 95vw;
            max-height: 95vh;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.3s ease-in;
          }
          
          .modal-close-fullscreen {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: #D32F2F;
            color: #FFF;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 1001;
            transition: opacity 0.2s;
          }
          
          .modal-close-fullscreen:hover {
            opacity: 0.8;
          }

          /* Agenda compacta em lista */
          .agenda-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-height: 400px;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0.5rem;
          }

          .agenda-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem;
            background: #8414D1;
            color: #FFF;
            border-radius: 6px;
            font-size: 0.85rem;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .agenda-item:hover {
            background: #7010C0;
            transform: translateX(4px);
          }

          .agenda-time {
            font-weight: bold;
            font-size: 0.8rem;
            white-space: nowrap;
          }

          .agenda-service {
            color: #E0E0E0;
            font-size: 0.75rem;
            white-space: nowrap;
          }

          .agenda-client {
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            font-size: 0.85rem;
          }

          .status-badge {
            font-size: 0.75rem !important;
            padding: 0.3rem 0.6rem !important;
            white-space: nowrap;
            border-radius: 4px !important;
          }

          .agenda-price {
            font-weight: bold;
            color: #FFF;
            font-size: 0.85rem;
            white-space: nowrap;
          }
        `}</style>
      </div>
    </MainLayout>
  )
}
