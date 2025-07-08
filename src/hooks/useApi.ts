import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  mutate: (newData: T) => void
}

interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

/**
 * Hook para fazer requisições GET automáticas
 */
export function useApi<T = any>(
  url: string | null, 
  options: UseApiOptions = {}
): UseApiState<T> {
  const { immediate = true, onSuccess, onError } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!url) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Corrigido: usar api diretamente sem tipagem genérica
      const response = await api.get(url)
      setData(response as T)
      
      if (onSuccess) {
        onSuccess(response)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro desconhecido'
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [url, onSuccess, onError])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  useEffect(() => {
    if (immediate && url) {
      fetchData()
    }
  }, [fetchData, immediate, url])

  return {
    data,
    loading,
    error,
    refresh,
    mutate
  }
}

/**
 * Hook para operações que modificam dados (POST, PUT, DELETE)
 */
export function useMutation<TData = any, TVariables = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    variables?: TVariables,
    options?: {
      onSuccess?: (data: TData) => void
      onError?: (error: string) => void
    }
  ): Promise<TData | null> => {
    try {
      setLoading(true)
      setError(null)

      console.log(`🚀 ${method.toUpperCase()} ${url}`, variables)

      let response: any
      
      switch (method) {
        case 'post':
          response = await api.post(url, variables)
          break
        case 'put':
          response = await api.put(url, variables)
          break
        case 'patch':
          response = await api.patch(url, variables)
          break
        case 'delete':
          response = await api.delete(url)
          break
        default:
          throw new Error(`Método ${method} não suportado`)
      }

      console.log(`✅ Resposta ${method.toUpperCase()} ${url}:`, response)

      if (options?.onSuccess) {
        options.onSuccess(response as TData)
      }

      return response as TData
    } catch (err: any) {
      console.error(`❌ Erro ${method.toUpperCase()} ${url}:`, err)
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro desconhecido'
      
      if (err.response?.data) {
        // Erro do servidor com dados
        const serverError = err.response.data
        errorMessage = serverError.error || 
                      serverError.message || 
                      serverError.msg ||
                      `Erro ${err.response.status}`
                      
        // Se há detalhes de validação, usar o primeiro
        if (serverError.detalhes && Array.isArray(serverError.detalhes) && serverError.detalhes.length > 0) {
          errorMessage = serverError.detalhes[0].message || errorMessage
        }
      } else if (err.message) {
        // Erro de rede ou outro
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      if (options?.onError) {
        options.onError(errorMessage)
      }
      
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    mutate,
    loading,
    error,
    reset: () => {
      setError(null)
      setLoading(false)
    }
  }
}

/**
 * Hook para paginação
 */
export function usePagination<T = any>(url: string, pageSize: number = 20) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const loadPage = useCallback(async (pageNumber: number, reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`${url}?page=${pageNumber}&limit=${pageSize}`)
      
      // ✅ SOLUÇÃO CORRETA: Validar primeiro e depois usar
      if (!response || typeof response !== 'object') {
        throw new Error('Resposta inválida da API')
      }

      // Agora podemos acessar as propriedades com segurança
      const success = (response as any).success
      const data = (response as any).data
      
      if (!success || !data) {
        throw new Error('Estrutura de resposta inválida')
      }

      const items = data.items || 
                    data.transacoes || 
                    data.orcamentos || 
                    data.metas || []
      
      const pagination = data.paginacao

      if (!pagination) {
        throw new Error('Dados de paginação não encontrados')
      }

      if (reset) {
        setData(items)
      } else {
        setData(prev => [...prev, ...items])
      }

      setPage(pageNumber)
      setHasMore(pageNumber < pagination.totalPages)
      setTotalItems(pagination.totalItems)

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar dados'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, pageSize])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1, false)
    }
  }, [loading, hasMore, page, loadPage])

  const refresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    loadPage(1, true)
  }, [loadPage])

  useEffect(() => {
    loadPage(1, true)
  }, [url])

  return {
    data,
    loading,
    error,
    hasMore,
    totalItems,
    currentPage: page,
    loadMore,
    refresh
  }
}

/**
 * Hook para upload de arquivos com progresso
 */
export function useUpload() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (
    url: string,
    file: FormData,
    options?: {
      onSuccess?: (data: any) => void
      onError?: (error: string) => void
    }
  ) => {
    try {
      setLoading(true)
      setError(null)
      setProgress(0)

      // Por enquanto, usar uma implementação básica
      // Você pode implementar o upload com progresso posteriormente
      const response = await api.post(url, file)

      if (options?.onSuccess) {
        options.onSuccess(response)
      }

      return response
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro no upload'
      setError(errorMessage)
      
      if (options?.onError) {
        options.onError(errorMessage)
      }
      
      return null
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [])

  return {
    upload,
    loading,
    progress,
    error,
    reset: () => {
      setError(null)
      setProgress(0)
      setLoading(false)
    }
  }
}

// Hooks específicos para as funcionalidades do app

/**
 * Hook para autenticação
 */
export function useAuthMutation() {
  const { mutate, loading, error, reset } = useMutation()

  const login = useCallback(async (email: string, password: string) => {
    // Converter campos para português como esperado pelo backend
    // IMPORTANTE: Limpar email e senha de espaços/quebras de linha
    return await mutate('post', '/auth/login', { 
      email: email.trim().toLowerCase(),  // Limpar e converter para minúsculo
      senha: password.trim()              // Limpar espaços
    })
  }, [mutate])

  const register = useCallback(async (name: string, email: string, password: string) => {
    // Converter campos para português como esperado pelo backend
    // IMPORTANTE: Limpar todos os campos
    return await mutate('post', '/auth/register', { 
      nome: name.trim(),                   // Limpar espaços
      email: email.trim().toLowerCase(),   // Limpar e converter para minúsculo
      senha: password.trim()               // Limpar espaços
    })
  }, [mutate])

  const forgotPassword = useCallback(async (email: string) => {
    return await mutate('post', '/auth/forgot-password', { 
      email: email.trim().toLowerCase()   // Limpar email
    })
  }, [mutate])

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    // 🔧 CORREÇÃO CRÍTICA: Backend espera 'code', não 'codigo'
    return await mutate('post', '/auth/reset-password', { 
      email: email.trim().toLowerCase(),  // Limpar email
      code: code.trim(),                  // ✅ CORRIGIDO: era 'codigo', agora é 'code'
      novaSenha: newPassword.trim()       // Limpar senha
    })
  }, [mutate])

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    loading,
    error,
    reset
  }
}

/**
 * Hook para transações
 */
export function useTransactionsMutation() {
  const { mutate, loading, error, reset } = useMutation()

  const createTransaction = useCallback(async (data: any) => {
    return await mutate('post', '/transactions', data)
  }, [mutate])

  const updateTransaction = useCallback(async (id: string, data: any) => {
    return await mutate('put', `/transactions/${id}`, data)
  }, [mutate])

  const deleteTransaction = useCallback(async (id: string) => {
    return await mutate('delete', `/transactions/${id}`)
  }, [mutate])

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loading,
    error,
    reset
  }
}

/**
 * Hook para orçamentos
 */
export function useBudgetsMutation() {
  const { mutate, loading, error, reset } = useMutation()

  const createBudget = useCallback(async (data: any) => {
    return await mutate('post', '/budgets', data)
  }, [mutate])

  const updateBudget = useCallback(async (id: string, data: any) => {
    return await mutate('put', `/budgets/${id}`, data)
  }, [mutate])

  const deleteBudget = useCallback(async (id: string) => {
    return await mutate('delete', `/budgets/${id}`)
  }, [mutate])

  return {
    createBudget,
    updateBudget,
    deleteBudget,
    loading,
    error,
    reset
  }
}

/**
 * Hook para metas
 */
export function useGoalsMutation() {
  const { mutate, loading, error, reset } = useMutation()

  const createGoal = useCallback(async (data: any) => {
    return await mutate('post', '/goals', data)
  }, [mutate])

  const updateGoal = useCallback(async (id: string, data: any) => {
    return await mutate('put', `/goals/${id}`, data)
  }, [mutate])

  const deleteGoal = useCallback(async (id: string) => {
    return await mutate('delete', `/goals/${id}`)
  }, [mutate])

  const addContribution = useCallback(async (id: string, valor: number, observacao?: string) => {
    return await mutate('post', `/goals/${id}/contribute`, { valor, observacao })
  }, [mutate])

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    loading,
    error,
    reset
  }
}