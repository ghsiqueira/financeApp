// src/utils/categoryManager.ts
import React from 'react'
import { useApi, useMutation } from '../hooks/useApi'
import { createDefaultCategories } from './createDefaultCategories'

export interface Categoria {
  _id?: string
  nome: string
  tipo: 'receita' | 'despesa'
  icone: string
  cor: string
  ordem: number
  ativa: boolean
  padrao: boolean
  subcategorias?: Subcategoria[]
  estatisticas?: {
    totalTransacoes: number
    totalValor: number
    ultimaTransacao: Date
  }
}

export interface Subcategoria {
  nome: string
  icone: string
  cor: string
  ativa: boolean
}

// Hook para gerenciar categorias
export const useCategorias = () => {
  const { data: categorias, loading: isLoading, error, refresh: refetch } = useApi('/categories')
  const { mutate } = useMutation()

  const criarCategoria = async (categoria: Omit<Categoria, '_id'>) => {
    return await mutate('post', '/categories', categoria)
  }

  const atualizarCategoria = async (id: string, categoria: Partial<Categoria>) => {
    return await mutate('put', `/categories/${id}`, categoria)
  }

  const excluirCategoria = async (id: string) => {
    return await mutate('delete', `/categories/${id}`)
  }

  const buscarCategorias = async (tipo?: 'receita' | 'despesa', termo?: string) => {
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)
    if (termo) params.append('q', termo)
    
    const response = await fetch(`/api/categories?${params}`)
    return response.json()
  }

  const importarCategoriasPadrao = async (sobrescrever = false) => {
    try {
      return await mutate('post', '/categories/importar-padrao', { sobrescrever })
    } catch (error) {
      // Fallback para criação manual
      console.log('Usando fallback para criação de categorias...')
      return await createDefaultCategories()
    }
  }

  const obterEstatisticas = async (categoriaId: string) => {
    const response = await fetch(`/api/categories/${categoriaId}/estatisticas`)
    return response.json()
  }

  const exportarCategorias = async (formato: 'json' | 'csv' = 'json') => {
    const response = await fetch(`/api/categories/exportar?formato=${formato}`)
    
    if (formato === 'csv') {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'categorias.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      return response.json()
    }
  }

  return {
    categorias: categorias?.data || [],
    isLoading,
    error,
    refetch,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    buscarCategorias,
    importarCategoriasPadrao,
    obterEstatisticas,
    exportarCategorias
  }
}

// Hook para categorias por tipo
export const useCategoriasPorTipo = (tipo: 'receita' | 'despesa') => {
  const { data, loading: isLoading, error } = useApi(`/categories?tipo=${tipo}`)
  
  return {
    categorias: data?.data || [],
    isLoading,
    error
  }
}

// Hook para categorias mais usadas
export const useCategoriasPopulares = (limite = 5) => {
  const { data, loading: isLoading, error } = useApi(`/categories/populares?limite=${limite}`)
  
  return {
    categorias: data?.data || [],
    isLoading,
    error
  }
}

// Utilitários para cores
export const CORES_CATEGORIAS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B'
]

// Utilitários para ícones
export const ICONES_CATEGORIAS = [
  'home', 'car', 'restaurant', 'medical', 'school',
  'game-controller', 'shirt', 'build', 'phone-portrait',
  'briefcase', 'trending-up', 'heart', 'gift', 'airplane',
  'fitness', 'book', 'musical-notes', 'camera', 'wallet',
  'card', 'storefront', 'bicycle', 'boat', 'train',
  'bus', 'cafe', 'wine', 'pizza', 'ice-cream'
]

// Função para obter cor aleatória
export const obterCorAleatoria = () => {
  return CORES_CATEGORIAS[Math.floor(Math.random() * CORES_CATEGORIAS.length)]
}

// Função para obter ícone aleatório
export const obterIconeAleatorio = () => {
  return ICONES_CATEGORIAS[Math.floor(Math.random() * ICONES_CATEGORIAS.length)]
}

// Função para validar categoria
export const validarCategoria = (categoria: Partial<Categoria>) => {
  const erros: string[] = []
  
  if (!categoria.nome || categoria.nome.trim().length === 0) {
    erros.push('Nome é obrigatório')
  }
  
  if (!categoria.tipo || !['receita', 'despesa'].includes(categoria.tipo)) {
    erros.push('Tipo deve ser "receita" ou "despesa"')
  }
  
  if (!categoria.icone || categoria.icone.trim().length === 0) {
    erros.push('Ícone é obrigatório')
  }
  
  if (!categoria.cor || !/^#[0-9A-F]{6}$/i.test(categoria.cor)) {
    erros.push('Cor deve estar no formato hexadecimal (#RRGGBB)')
  }
  
  if (categoria.nome && categoria.nome.length > 50) {
    erros.push('Nome deve ter no máximo 50 caracteres')
  }
  
  if (categoria.subcategorias) {
    categoria.subcategorias.forEach((sub, index) => {
      if (!sub.nome || sub.nome.trim().length === 0) {
        erros.push(`Subcategoria ${index + 1}: Nome é obrigatório`)
      }
      if (sub.nome && sub.nome.length > 30) {
        erros.push(`Subcategoria ${index + 1}: Nome deve ter no máximo 30 caracteres`)
      }
    })
  }
  
  return {
    valida: erros.length === 0,
    erros
  }
}

// Função para formatar categoria para exibição
export const formatarCategoria = (categoria: Categoria) => {
  return {
    ...categoria,
    nomeFormatado: categoria.nome.charAt(0).toUpperCase() + categoria.nome.slice(1),
    tipoFormatado: categoria.tipo === 'receita' ? 'Receita' : 'Despesa',
    subcategoriasAtivas: categoria.subcategorias?.filter(sub => sub.ativa) || []
  }
}

// Função para agrupar categorias por tipo
export const agruparCategoriasPorTipo = (categorias: Categoria[]) => {
  return categorias.reduce((acc, categoria) => {
    if (!acc[categoria.tipo]) {
      acc[categoria.tipo] = []
    }
    acc[categoria.tipo].push(categoria)
    return acc
  }, {} as Record<string, Categoria[]>)
}

// Função para buscar categoria por ID
export const buscarCategoriaPorId = (categorias: Categoria[], id: string) => {
  return categorias.find((cat: Categoria) => cat._id === id)
}

// Função para buscar categoria por nome
export const buscarCategoriaPorNome = (categorias: Categoria[], nome: string) => {
  return categorias.find((cat: Categoria) => 
    cat.nome.toLowerCase() === nome.toLowerCase()
  )
}

// Função para obter categorias mais usadas
export const obterCategoriasMaisUsadas = (categorias: Categoria[], limite = 5) => {
  return categorias
    .filter((cat: Categoria) => cat.estatisticas && cat.estatisticas.totalTransacoes > 0)
    .sort((a: Categoria, b: Categoria) => {
      const totalA = a.estatisticas?.totalTransacoes || 0
      const totalB = b.estatisticas?.totalTransacoes || 0
      return totalB - totalA
    })
    .slice(0, limite)
}

// Função para verificar se categoria pode ser excluída
export const podeExcluirCategoria = (categoria: Categoria) => {
  // Não pode excluir categorias padrão
  if (categoria.padrao) {
    return {
      pode: false,
      motivo: 'Não é possível excluir categorias padrão'
    }
  }
  
  // Não pode excluir se tem transações
  if (categoria.estatisticas && categoria.estatisticas.totalTransacoes > 0) {
    return {
      pode: false,
      motivo: 'Não é possível excluir categoria com transações associadas'
    }
  }
  
  return {
    pode: true,
    motivo: null
  }
}

// Hook para inicialização automática de categorias
export const useInicializarCategorias = () => {
  const { categorias, importarCategoriasPadrao } = useCategorias()
  const [inicializado, setInicializado] = React.useState(false)
  
  React.useEffect(() => {
    const inicializar = async () => {
      if (inicializado || categorias.length > 0) return
      
      try {
        console.log('🚀 Inicializando categorias padrão...')
        await importarCategoriasPadrao()
        setInicializado(true)
        console.log('✅ Categorias inicializadas com sucesso')
      } catch (error) {
        console.error('❌ Erro ao inicializar categorias:', error)
      }
    }
    
    inicializar()
  }, [categorias.length, importarCategoriasPadrao, inicializado])
  
  return {
    inicializado: inicializado || categorias.length > 0,
    totalCategorias: categorias.length
  }
}

// Context para categorias (opcional, para estado global)
export const CategoriasContext = React.createContext<{
  categorias: Categoria[]
  categoriasReceita: Categoria[]
  categoriasDespesa: Categoria[]
  criarCategoria: (categoria: Omit<Categoria, '_id'>) => Promise<any>
  atualizarCategoria: (id: string, categoria: Partial<Categoria>) => Promise<any>
  excluirCategoria: (id: string) => Promise<any>
  isLoading: boolean
  error: any
} | null>(null)

export const CategoriasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    categorias,
    isLoading,
    error,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
  } = useCategorias()
  
  const categoriasReceita = React.useMemo(() => 
    categorias.filter((cat: Categoria) => cat.tipo === 'receita'),
    [categorias]
  )
  
  const categoriasDespesa = React.useMemo(() => 
    categorias.filter((cat: Categoria) => cat.tipo === 'despesa'),
    [categorias]
  )
  
  return (
    <CategoriasContext.Provider value={{
      categorias,
      categoriasReceita,
      categoriasDespesa,
      criarCategoria,
      atualizarCategoria,
      excluirCategoria,
      isLoading,
      error
    }}>
      {children}
    </CategoriasContext.Provider>
  )
}

export const useCategoriesContext = () => {
  const context = React.useContext(CategoriasContext)
  if (!context) {
    throw new Error('useCategoriesContext deve ser usado dentro de CategoriasProvider')
  }
  return context
}