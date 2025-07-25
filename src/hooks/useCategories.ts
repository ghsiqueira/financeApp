// src/hooks/useCategories.ts - Hook robusto para categorias
import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export interface Category {
  _id: string
  nome: string
  tipo: 'receita' | 'despesa' | 'ambos'
  icone: string
  cor: string
  descricao?: string
  padrao?: boolean
  ordem?: number
}

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getByType: (tipo: 'receita' | 'despesa' | 'ambos') => Category[]
  getById: (id: string) => Category | undefined
}

export const useCategories = (tipo?: 'receita' | 'despesa'): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando categorias...', tipo ? `tipo=${tipo}` : 'todas')

      // Construir URL com query params se necessário
      const url = tipo ? `/categories?tipo=${tipo}` : '/categories'
      
      const response = await api.get(url)
      
      console.log('📋 Resposta da API:', response.data)

      // Verificar se a resposta tem o formato esperado
      if (response.data && response.data.success) {
        const categoriesData = response.data.data || []
        setCategories(categoriesData)
        console.log(`✅ ${categoriesData.length} categorias carregadas`)
      } else if (Array.isArray(response.data)) {
        // Caso a API retorne diretamente um array
        setCategories(response.data)
        console.log(`✅ ${response.data.length} categorias carregadas (formato array)`)
      } else {
        throw new Error('Formato de resposta inválido')
      }

    } catch (err: any) {
      console.error('❌ Erro ao buscar categorias:', err)
      
      let errorMessage = 'Erro ao carregar categorias'
      
      if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.'
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint de categorias não encontrado'
      } else if (err.response?.status === 500) {
        errorMessage = 'Erro interno do servidor'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Fallback: usar categorias padrão em caso de erro
      setCategories(getCategoriasPadrao(tipo))
      
    } finally {
      setLoading(false)
    }
  }, [tipo])

  // Funções utilitárias
  const getByType = useCallback((filterTipo: 'receita' | 'despesa' | 'ambos') => {
    return categories.filter(cat => cat.tipo === filterTipo || cat.tipo === 'ambos')
  }, [categories])

  const getById = useCallback((id: string) => {
    return categories.find(cat => cat._id === id)
  }, [categories])

  const refresh = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])

  // Carregar categorias na inicialização
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    refresh,
    getByType,
    getById,
  }
}

// 🔧 CATEGORIAS PADRÃO COMO FALLBACK
const getCategoriasPadrao = (tipo?: 'receita' | 'despesa'): Category[] => {
  const categoriasCompletas: Category[] = [
    // Despesas
    { _id: 'fallback-1', nome: 'Alimentação', tipo: 'despesa', icone: 'restaurant', cor: '#FF5722' },
    { _id: 'fallback-2', nome: 'Transporte', tipo: 'despesa', icone: 'car', cor: '#607D8B' },
    { _id: 'fallback-3', nome: 'Moradia', tipo: 'despesa', icone: 'home', cor: '#795548' },
    { _id: 'fallback-4', nome: 'Saúde', tipo: 'despesa', icone: 'medical', cor: '#F44336' },
    { _id: 'fallback-5', nome: 'Educação', tipo: 'despesa', icone: 'school', cor: '#3F51B5' },
    { _id: 'fallback-6', nome: 'Lazer', tipo: 'despesa', icone: 'game-controller', cor: '#9C27B0' },
    { _id: 'fallback-7', nome: 'Vestuário', tipo: 'despesa', icone: 'shirt', cor: '#E91E63' },
    { _id: 'fallback-8', nome: 'Tecnologia', tipo: 'despesa', icone: 'phone-portrait', cor: '#2196F3' },
    { _id: 'fallback-9', nome: 'Outros', tipo: 'despesa', icone: 'ellipsis-horizontal', cor: '#9E9E9E' },
    
    // Receitas
    { _id: 'fallback-10', nome: 'Salário', tipo: 'receita', icone: 'wallet', cor: '#4CAF50' },
    { _id: 'fallback-11', nome: 'Freelance', tipo: 'receita', icone: 'briefcase', cor: '#FF9800' },
    { _id: 'fallback-12', nome: 'Investimentos', tipo: 'receita', icone: 'trending-up', cor: '#009688' },
    { _id: 'fallback-13', nome: 'Vendas', tipo: 'receita', icone: 'storefront', cor: '#2196F3' },
    { _id: 'fallback-14', nome: 'Presentes', tipo: 'receita', icone: 'gift', cor: '#E91E63' },
    { _id: 'fallback-15', nome: 'Outros', tipo: 'receita', icone: 'ellipsis-horizontal', cor: '#607D8B' },
  ]

  if (tipo) {
    return categoriasCompletas.filter(cat => cat.tipo === tipo)
  }
  
  return categoriasCompletas
}

// Hook específico para despesas
export const useDespesaCategories = () => {
  return useCategories('despesa')
}

// Hook específico para receitas  
export const useReceitaCategories = () => {
  return useCategories('receita')
}