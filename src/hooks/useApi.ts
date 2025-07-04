import { useState, useEffect, useCallback } from 'react'
import apiService from '../services/api'

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
      
      const response = await apiService.get<T>(url)
      setData(response)
      
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

      let response: TData
      
      switch (method) {
        case 'post':
          response = await apiService.post<TData>(url, variables)
          break
        case 'put':
          response = await apiService.put<TData>(url, variables)
          break
        case 'patch':
          response = await apiService.patch<TData>(url, variables)
          break
        case 'delete':
          response = await apiService.delete<TData>(url)
          break
        default:
          throw new Error(`Método ${method} não suportado`)
      }

      if (options?.onSuccess) {
        options.onSuccess(response)
      }

      return response
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro desconhecido'
      setError(errorMessage)
      
      if (options?.onError) {
        options.onError(errorMessage)
      }
      
      return null
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

      const response = await apiService.get<{
        success: boolean
        data: {
          items?: T[]
          transacoes?: T[]
          orcamentos?: T[]
          metas?: T[]
          paginacao: {
            currentPage: number
            totalPages: number
            totalItems: number
            itemsPerPage: number
          }
        }
      }>(`${url}?page=${pageNumber}&limit=${pageSize}`)

      const items = response.data.items || response.data.transacoes || response.data.orcamentos || response.data.metas || []
      const pagination = response.data.paginacao

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

      const response = await apiService.upload(url, file, (progressPercent) => {
        setProgress(progressPercent)
      })

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