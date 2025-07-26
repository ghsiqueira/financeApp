// src/hooks/useBudgets.ts - Hook especializado para orçamentos
import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export interface Budget {
  _id: string
  nome: string
  categoria: string
  valorLimite: number
  valorGasto: number
  periodo: 'semanal' | 'mensal' | 'trimestral' | 'anual' | 'personalizado'
  dataInicio: string
  dataFim: string
  status: 'ativo' | 'pausado' | 'finalizado' | 'excedido'
  cor: string
  icone: string
  porcentagemGasta: number
  valorRestante: number
  diasRestantes: number
  renovacaoAutomatica: boolean
  ultimaRenovacao?: string
  vencido?: boolean
  descricao?: string
  configuracoes?: {
    alertas: {
      ativo: boolean
      porcentagens: number[]
      email: boolean
      push: boolean
    }
    renovacao: {
      rollover: boolean
      ajusteAutomatico: boolean
      percentualAjuste: number
      notificarRenovacao: boolean
    }
  }
  estatisticasRenovacao?: {
    totalRenovacoes: number
    mediaGastosPorPeriodo: number
    melhorPerformance?: {
      porcentagem: number
      periodo: string
    }
    piorPerformance?: {
      porcentagem: number
      periodo: string
    }
  }
  historico?: Array<{
    data: string
    acao: string
    valor?: number
    observacao?: string
    usuarioId?: string
  }>
  transacoes?: Array<{
    _id: string
    descricao: string
    valor: number
    data: string
    tipo: 'receita' | 'despesa'
    categoria: string
    metodoPagamento?: string
  }>
}

export interface BudgetSummary {
  totalLimite: number
  totalGasto: number
  totalRestante: number
  excedidos: number
  emAlerta: number
  vencendoEm7Dias: number
  comRenovacaoAutomatica: number
  economiaTotal?: number
  mediaMensal?: number
}

export interface BudgetsResponse {
  success: boolean
  data: {
    orcamentos: Budget[]
    resumo: BudgetSummary
    total: number
    paginacao?: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
  message?: string
}

interface UseBudgetsOptions {
  autoRefresh?: boolean
  filters?: {
    status?: string
    categoria?: string
  }
}

interface UseBudgetsResult {
  budgets: Budget[]
  summary: BudgetSummary
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createBudget: (budgetData: Partial<Budget>) => Promise<Budget>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>
  deleteBudget: (id: string) => Promise<void>
  pauseBudget: (id: string) => Promise<Budget>
  reactivateBudget: (id: string) => Promise<Budget>
  getBudgetById: (id: string) => Budget | undefined
  filterBudgets: (filter: 'ativos' | 'excedidos' | 'pausados' | 'todos') => Budget[]
}

export const useBudgets = (options: UseBudgetsOptions = {}): UseBudgetsResult => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState<BudgetSummary>({
    totalLimite: 0,
    totalGasto: 0,
    totalRestante: 0,
    excedidos: 0,
    emAlerta: 0,
    vencendoEm7Dias: 0,
    comRenovacaoAutomatica: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar orçamentos
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando orçamentos...')

      // Construir URL com filtros se fornecidos
      let url = '/budgets'
      const queryParams = new URLSearchParams()
      
      if (options.filters?.status) {
        queryParams.append('status', options.filters.status)
      }
      
      if (options.filters?.categoria) {
        queryParams.append('categoria', options.filters.categoria)
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      const response = await api.get(url)
      
      console.log('📋 Resposta da API budgets:', response.data)

      // Verificar se a resposta tem o formato esperado
      if (response.data.success && response.data.data) {
        const { orcamentos, resumo, total } = response.data.data
        
        // Validar dados
        if (Array.isArray(orcamentos)) {
          setBudgets(orcamentos)
          console.log(`✅ ${orcamentos.length} orçamentos carregados`)
        } else {
          console.warn('⚠️ Formato inválido de orçamentos:', orcamentos)
          setBudgets([])
        }
        
        if (resumo && typeof resumo === 'object') {
          setSummary(resumo)
          console.log('✅ Resumo de orçamentos carregado:', resumo)
        } else {
          console.warn('⚠️ Formato inválido de resumo:', resumo)
        }
        
      } else {
        // Tentar formato alternativo (array direto)
        if (Array.isArray(response.data)) {
          setBudgets(response.data)
          console.log(`✅ ${response.data.length} orçamentos carregados (formato array)`)
          
          // Calcular resumo manualmente se não fornecido
          const calculatedSummary = calculateSummary(response.data)
          setSummary(calculatedSummary)
        } else {
          throw new Error('Formato de resposta não reconhecido')
        }
      }

    } catch (err: any) {
      console.error('❌ Erro ao buscar orçamentos:', err)
      
      let errorMessage = 'Erro ao carregar orçamentos'
      
      if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.'
      } else if (err.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.'
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint de orçamentos não encontrado.'
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setBudgets([])
      setSummary({
        totalLimite: 0,
        totalGasto: 0,
        totalRestante: 0,
        excedidos: 0,
        emAlerta: 0,
        vencendoEm7Dias: 0,
        comRenovacaoAutomatica: 0
      })
    } finally {
      setLoading(false)
    }
  }, [options.filters])

  // Função para calcular resumo manualmente
  const calculateSummary = (budgetsList: Budget[]): BudgetSummary => {
    return budgetsList.reduce((acc, budget) => {
      acc.totalLimite += budget.valorLimite || 0
      acc.totalGasto += budget.valorGasto || 0
      acc.totalRestante += budget.valorRestante || 0
      
      if (budget.porcentagemGasta >= 100) acc.excedidos++
      if (budget.porcentagemGasta >= 80 && budget.porcentagemGasta < 100) acc.emAlerta++
      if (budget.diasRestantes <= 7 && budget.diasRestantes > 0) acc.vencendoEm7Dias++
      if (budget.renovacaoAutomatica) acc.comRenovacaoAutomatica++
      
      return acc
    }, {
      totalLimite: 0,
      totalGasto: 0,
      totalRestante: 0,
      excedidos: 0,
      emAlerta: 0,
      vencendoEm7Dias: 0,
      comRenovacaoAutomatica: 0
    })
  }

  // Função para criar orçamento
  const createBudget = useCallback(async (budgetData: Partial<Budget>): Promise<Budget> => {
    try {
      console.log('📝 Criando orçamento:', budgetData)
      
      const response = await api.post('/budgets', budgetData)
      
      if (response.data.success && response.data.data) {
        const newBudget = response.data.data
        setBudgets(prev => [...prev, newBudget])
        
        // Recalcular resumo
        const updatedBudgets = [...budgets, newBudget]
        setSummary(calculateSummary(updatedBudgets))
        
        console.log('✅ Orçamento criado com sucesso')
        return newBudget
      } else {
        throw new Error(response.data.message || 'Erro ao criar orçamento')
      }
    } catch (err: any) {
      console.error('❌ Erro ao criar orçamento:', err)
      throw new Error(err.response?.data?.error || err.message || 'Erro ao criar orçamento')
    }
  }, [budgets])

  // Função para atualizar orçamento
  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>): Promise<Budget> => {
    try {
      console.log(`📝 Atualizando orçamento ${id}:`, updates)
      
      const response = await api.put(`/budgets/${id}`, updates)
      
      if (response.data.success && response.data.data) {
        const updatedBudget = response.data.data
        setBudgets(prev => prev.map(budget => 
          budget._id === id ? updatedBudget : budget
        ))
        
        // Recalcular resumo
        const updatedBudgets = budgets.map(budget => 
          budget._id === id ? updatedBudget : budget
        )
        setSummary(calculateSummary(updatedBudgets))
        
        console.log('✅ Orçamento atualizado com sucesso')
        return updatedBudget
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar orçamento')
      }
    } catch (err: any) {
      console.error('❌ Erro ao atualizar orçamento:', err)
      throw new Error(err.response?.data?.error || err.message || 'Erro ao atualizar orçamento')
    }
  }, [budgets])

  // Função para deletar orçamento
  const deleteBudget = useCallback(async (id: string): Promise<void> => {
    try {
      console.log(`🗑️ Deletando orçamento ${id}`)
      
      const response = await api.delete(`/budgets/${id}`)
      
      if (response.data.success) {
        setBudgets(prev => prev.filter(budget => budget._id !== id))
        
        // Recalcular resumo
        const updatedBudgets = budgets.filter(budget => budget._id !== id)
        setSummary(calculateSummary(updatedBudgets))
        
        console.log('✅ Orçamento deletado com sucesso')
      } else {
        throw new Error(response.data.message || 'Erro ao deletar orçamento')
      }
    } catch (err: any) {
      console.error('❌ Erro ao deletar orçamento:', err)
      throw new Error(err.response?.data?.error || err.message || 'Erro ao deletar orçamento')
    }
  }, [budgets])

  // Função para pausar orçamento
  const pauseBudget = useCallback(async (id: string): Promise<Budget> => {
    try {
      console.log(`⏸️ Pausando orçamento ${id}`)
      
      const response = await api.put(`/budgets/${id}/pausar`)
      
      if (response.data.success && response.data.data) {
        const updatedBudget = response.data.data
        setBudgets(prev => prev.map(budget => 
          budget._id === id ? updatedBudget : budget
        ))
        
        console.log('✅ Orçamento pausado com sucesso')
        return updatedBudget
      } else {
        throw new Error(response.data.message || 'Erro ao pausar orçamento')
      }
    } catch (err: any) {
      console.error('❌ Erro ao pausar orçamento:', err)
      throw new Error(err.response?.data?.error || err.message || 'Erro ao pausar orçamento')
    }
  }, [])

  // Função para reativar orçamento
  const reactivateBudget = useCallback(async (id: string): Promise<Budget> => {
    try {
      console.log(`▶️ Reativando orçamento ${id}`)
      
      const response = await api.put(`/budgets/${id}/reativar`)
      
      if (response.data.success && response.data.data) {
        const updatedBudget = response.data.data
        setBudgets(prev => prev.map(budget => 
          budget._id === id ? updatedBudget : budget
        ))
        
        console.log('✅ Orçamento reativado com sucesso')
        return updatedBudget
      } else {
        throw new Error(response.data.message || 'Erro ao reativar orçamento')
      }
    } catch (err: any) {
      console.error('❌ Erro ao reativar orçamento:', err)
      throw new Error(err.response?.data?.error || err.message || 'Erro ao reativar orçamento')
    }
  }, [])

  // Função para buscar orçamento por ID
  const getBudgetById = useCallback((id: string): Budget | undefined => {
    return budgets.find(budget => budget._id === id)
  }, [budgets])

  // Função para filtrar orçamentos
  const filterBudgets = useCallback((filter: 'ativos' | 'excedidos' | 'pausados' | 'todos'): Budget[] => {
    switch (filter) {
      case 'ativos':
        return budgets.filter(budget => budget.status === 'ativo')
      case 'excedidos':
        return budgets.filter(budget => budget.porcentagemGasta >= 100)
      case 'pausados':
        return budgets.filter(budget => budget.status === 'pausado')
      case 'todos':
      default:
        return budgets
    }
  }, [budgets])

  // Função de refresh
  const refresh = useCallback(async () => {
    await fetchBudgets()
  }, [fetchBudgets])

  // Carregar dados iniciais
  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  // Auto refresh se habilitado
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(fetchBudgets, 30000) // 30 segundos
      return () => clearInterval(interval)
    }
  }, [fetchBudgets, options.autoRefresh])

  return {
    budgets,
    summary,
    loading,
    error,
    refresh,
    createBudget,
    updateBudget,
    deleteBudget,
    pauseBudget,
    reactivateBudget,
    getBudgetById,
    filterBudgets
  }
}