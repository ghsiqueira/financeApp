import React from 'react'

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

export const CORES_CATEGORIAS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B'
]

export const ICONES_CATEGORIAS = [
  'home', 'car', 'restaurant', 'medical', 'school',
  'game-controller', 'shirt', 'build', 'phone-portrait',
  'briefcase', 'trending-up', 'heart', 'gift', 'airplane',
  'fitness', 'book', 'musical-notes', 'camera', 'wallet',
  'card', 'storefront', 'bicycle', 'boat', 'train',
  'bus', 'cafe', 'wine', 'pizza', 'ice-cream'
]

export const obterCorAleatoria = (): string => {
  return CORES_CATEGORIAS[Math.floor(Math.random() * CORES_CATEGORIAS.length)]
}

export const obterIconeAleatorio = (): string => {
  return ICONES_CATEGORIAS[Math.floor(Math.random() * ICONES_CATEGORIAS.length)]
}

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
    erros.push('Cor deve estar no formato hexadecimal')
  }
  
  if (categoria.nome && categoria.nome.length > 50) {
    erros.push('Nome deve ter no máximo 50 caracteres')
  }
  
  return {
    valida: erros.length === 0,
    erros
  }
}

export const formatarCategoria = (categoria: Categoria) => {
  return {
    ...categoria,
    nomeFormatado: categoria.nome.charAt(0).toUpperCase() + categoria.nome.slice(1),
    tipoFormatado: categoria.tipo === 'receita' ? 'Receita' : 'Despesa',
    subcategoriasAtivas: categoria.subcategorias?.filter(sub => sub.ativa) || []
  }
}

export const buscarCategoriaPorId = (categorias: Categoria[], id: string): Categoria | undefined => {
  return categorias.find(cat => cat._id === id)
}

export const buscarCategoriaPorNome = (categorias: Categoria[], nome: string): Categoria | undefined => {
  return categorias.find(cat => cat.nome.toLowerCase() === nome.toLowerCase())
}

export const agruparCategoriasPorTipo = (categorias: Categoria[]) => {
  const grupos: Record<string, Categoria[]> = {}
  
  categorias.forEach(categoria => {
    if (!grupos[categoria.tipo]) {
      grupos[categoria.tipo] = []
    }
    grupos[categoria.tipo].push(categoria)
  })
  
  return grupos
}

export const podeExcluirCategoria = (categoria: Categoria) => {
  if (categoria.padrao) {
    return {
      pode: false,
      motivo: 'Não é possível excluir categorias padrão'
    }
  }
  
  if (categoria.estatisticas && categoria.estatisticas.totalTransacoes > 0) {
    return {
      pode: false,
      motivo: 'Categoria possui transações associadas'
    }
  }
  
  return {
    pode: true,
    motivo: null
  }
}

export const useCategorias = () => {
  const [categorias, setCategorias] = React.useState<Categoria[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const carregarCategorias = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.data || [])
      } else {
        throw new Error('Erro ao carregar categorias')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const criarCategoria = React.useCallback(async (categoria: Omit<Categoria, '_id'>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoria)
      })
      
      if (response.ok) {
        const novaCategoria = await response.json()
        setCategorias(prev => [...prev, novaCategoria.data])
        return novaCategoria
      } else {
        throw new Error('Erro ao criar categoria')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const atualizarCategoria = React.useCallback(async (id: string, categoria: Partial<Categoria>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoria)
      })
      
      if (response.ok) {
        const categoriaAtualizada = await response.json()
        setCategorias(prev => 
          prev.map(cat => cat._id === id ? categoriaAtualizada.data : cat)
        )
        return categoriaAtualizada
      } else {
        throw new Error('Erro ao atualizar categoria')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const excluirCategoria = React.useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCategorias(prev => prev.filter(cat => cat._id !== id))
        return true
      } else {
        throw new Error('Erro ao excluir categoria')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = React.useCallback(() => {
    carregarCategorias()
  }, [carregarCategorias])

  React.useEffect(() => {
    carregarCategorias()
  }, [carregarCategorias])

  return {
    categorias,
    isLoading,
    error,
    refetch,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
  }
}

export const useCategoriasPorTipo = (tipo: 'receita' | 'despesa') => {
  const { categorias, isLoading, error } = useCategorias()
  
  const categoriasFiltradas = React.useMemo(() => {
    return categorias.filter(cat => cat.tipo === tipo)
  }, [categorias, tipo])
  
  return {
    categorias: categoriasFiltradas,
    isLoading,
    error
  }
}

export const useCategoriasPopulares = (limite: number = 5) => {
  const { categorias, isLoading, error } = useCategorias()
  
  const categoriasPopulares = React.useMemo(() => {
    return categorias
      .filter(cat => cat.estatisticas && cat.estatisticas.totalTransacoes > 0)
      .sort((a, b) => {
        const totalA = a.estatisticas?.totalTransacoes || 0
        const totalB = b.estatisticas?.totalTransacoes || 0
        return totalB - totalA
      })
      .slice(0, limite)
  }, [categorias, limite])
  
  return {
    categorias: categoriasPopulares,
    isLoading,
    error
  }
}