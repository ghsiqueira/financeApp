// src/utils/createDefaultCategories.ts
import React from 'react'
import { useMutation } from '../hooks/useApi'

// Categorias padrão para receitas
const DEFAULT_INCOME_CATEGORIES = [
  { 
    nome: 'Salário', 
    icone: 'briefcase', 
    cor: '#4CAF50', 
    tipo: 'receita',
    ordem: 1,
    subcategorias: [
      { nome: 'Salário Principal', icone: 'briefcase', cor: '#4CAF50' },
      { nome: 'Salário Secundário', icone: 'briefcase-outline', cor: '#4CAF50' },
      { nome: 'Hora Extra', icone: 'time', cor: '#4CAF50' },
      { nome: 'Comissão', icone: 'trending-up', cor: '#4CAF50' },
      { nome: '13º Salário', icone: 'gift', cor: '#4CAF50' },
      { nome: 'Férias', icone: 'beach', cor: '#4CAF50' }
    ]
  },
  { 
    nome: 'Freelance', 
    icone: 'laptop', 
    cor: '#2196F3', 
    tipo: 'receita',
    ordem: 2,
    subcategorias: [
      { nome: 'Desenvolvimento', icone: 'code', cor: '#2196F3' },
      { nome: 'Design', icone: 'color-palette', cor: '#2196F3' },
      { nome: 'Consultoria', icone: 'people', cor: '#2196F3' },
      { nome: 'Redação', icone: 'create', cor: '#2196F3' },
      { nome: 'Marketing', icone: 'megaphone', cor: '#2196F3' }
    ]
  },
  { 
    nome: 'Investimentos', 
    icone: 'trending-up', 
    cor: '#9C27B0', 
    tipo: 'receita',
    ordem: 3,
    subcategorias: [
      { nome: 'Dividendos', icone: 'cash', cor: '#9C27B0' },
      { nome: 'Juros', icone: 'calculator', cor: '#9C27B0' },
      { nome: 'Renda Fixa', icone: 'bar-chart', cor: '#9C27B0' },
      { nome: 'Renda Variável', icone: 'stats-chart', cor: '#9C27B0' },
      { nome: 'Criptomoedas', icone: 'logo-bitcoin', cor: '#9C27B0' },
      { nome: 'Fundos', icone: 'wallet', cor: '#9C27B0' }
    ]
  },
  { 
    nome: 'Vendas', 
    icone: 'storefront', 
    cor: '#FF9800', 
    tipo: 'receita',
    ordem: 4,
    subcategorias: [
      { nome: 'Produtos', icone: 'cube', cor: '#FF9800' },
      { nome: 'Serviços', icone: 'construct', cor: '#FF9800' },
      { nome: 'Comissões', icone: 'trending-up', cor: '#FF9800' },
      { nome: 'Revendas', icone: 'repeat', cor: '#FF9800' }
    ]
  },
  { 
    nome: 'Renda Passiva', 
    icone: 'home', 
    cor: '#00BCD4', 
    tipo: 'receita',
    ordem: 5,
    subcategorias: [
      { nome: 'Aluguel', icone: 'home', cor: '#00BCD4' },
      { nome: 'Royalties', icone: 'musical-notes', cor: '#00BCD4' },
      { nome: 'Direitos Autorais', icone: 'document-text', cor: '#00BCD4' },
      { nome: 'Licenças', icone: 'key', cor: '#00BCD4' }
    ]
  },
  { 
    nome: 'Bonificações', 
    icone: 'gift', 
    cor: '#E91E63', 
    tipo: 'receita',
    ordem: 6,
    subcategorias: [
      { nome: 'Bônus', icone: 'star', cor: '#E91E63' },
      { nome: 'Prêmios', icone: 'trophy', cor: '#E91E63' },
      { nome: 'Gratificações', icone: 'heart', cor: '#E91E63' },
      { nome: 'PLR', icone: 'people', cor: '#E91E63' }
    ]
  },
  { 
    nome: 'Outros', 
    icone: 'ellipsis-horizontal', 
    cor: '#607D8B', 
    tipo: 'receita',
    ordem: 7,
    subcategorias: [
      { nome: 'Reembolsos', icone: 'refresh', cor: '#607D8B' },
      { nome: 'Empréstimos Recebidos', icone: 'hand-right', cor: '#607D8B' },
      { nome: 'Vendas Eventuais', icone: 'pricetag', cor: '#607D8B' },
      { nome: 'Doações Recebidas', icone: 'heart', cor: '#607D8B' }
    ]
  }
]

// Categorias padrão para despesas
const DEFAULT_EXPENSE_CATEGORIES = [
  { 
    nome: 'Alimentação', 
    icone: 'restaurant', 
    cor: '#FF5722', 
    tipo: 'despesa',
    ordem: 1,
    subcategorias: [
      { nome: 'Supermercado', icone: 'storefront', cor: '#FF5722' },
      { nome: 'Restaurantes', icone: 'restaurant', cor: '#FF5722' },
      { nome: 'Lanchonetes', icone: 'fast-food', cor: '#FF5722' },
      { nome: 'Delivery', icone: 'bicycle', cor: '#FF5722' },
      { nome: 'Padaria', icone: 'cafe', cor: '#FF5722' },
      { nome: 'Bebidas', icone: 'wine', cor: '#FF5722' }
    ]
  },
  { 
    nome: 'Transporte', 
    icone: 'car', 
    cor: '#607D8B', 
    tipo: 'despesa',
    ordem: 2,
    subcategorias: [
      { nome: 'Combustível', icone: 'car', cor: '#607D8B' },
      { nome: 'Transporte Público', icone: 'bus', cor: '#607D8B' },
      { nome: 'Uber/Taxi', icone: 'car-sport', cor: '#607D8B' },
      { nome: 'Estacionamento', icone: 'car', cor: '#607D8B' },
      { nome: 'Manutenção', icone: 'construct', cor: '#607D8B' },
      { nome: 'Seguro Veículo', icone: 'shield', cor: '#607D8B' },
      { nome: 'IPVA', icone: 'document-text', cor: '#607D8B' }
    ]
  },
  { 
    nome: 'Moradia', 
    icone: 'home', 
    cor: '#795548', 
    tipo: 'despesa',
    ordem: 3,
    subcategorias: [
      { nome: 'Aluguel', icone: 'home', cor: '#795548' },
      { nome: 'Financiamento', icone: 'card', cor: '#795548' },
      { nome: 'Condomínio', icone: 'business', cor: '#795548' },
      { nome: 'Luz', icone: 'flash', cor: '#795548' },
      { nome: 'Água', icone: 'water', cor: '#795548' },
      { nome: 'Gás', icone: 'flame', cor: '#795548' },
      { nome: 'Internet', icone: 'wifi', cor: '#795548' },
      { nome: 'Telefone', icone: 'call', cor: '#795548' },
      { nome: 'IPTU', icone: 'document-text', cor: '#795548' },
      { nome: 'Reparos', icone: 'hammer', cor: '#795548' }
    ]
  },
  { 
    nome: 'Saúde', 
    icone: 'medical', 
    cor: '#F44336', 
    tipo: 'despesa',
    ordem: 4,
    subcategorias: [
      { nome: 'Plano de Saúde', icone: 'medical', cor: '#F44336' },
      { nome: 'Médico', icone: 'person', cor: '#F44336' },
      { nome: 'Dentista', icone: 'happy', cor: '#F44336' },
      { nome: 'Farmácia', icone: 'medical', cor: '#F44336' },
      { nome: 'Exames', icone: 'analytics', cor: '#F44336' },
      { nome: 'Psicólogo', icone: 'brain', cor: '#F44336' },
      { nome: 'Academia', icone: 'fitness', cor: '#F44336' }
    ]
  },
  { 
    nome: 'Educação', 
    icone: 'school', 
    cor: '#3F51B5', 
    tipo: 'despesa',
    ordem: 5,
    subcategorias: [
      { nome: 'Mensalidade', icone: 'school', cor: '#3F51B5' },
      { nome: 'Livros', icone: 'book', cor: '#3F51B5' },
      { nome: 'Material Escolar', icone: 'pencil', cor: '#3F51B5' },
      { nome: 'Cursos', icone: 'library', cor: '#3F51B5' },
      { nome: 'Idiomas', icone: 'language', cor: '#3F51B5' },
      { nome: 'Transporte Escolar', icone: 'bus', cor: '#3F51B5' }
    ]
  },
  { 
    nome: 'Lazer', 
    icone: 'game-controller', 
    cor: '#9C27B0', 
    tipo: 'despesa',
    ordem: 6,
    subcategorias: [
      { nome: 'Cinema', icone: 'film', cor: '#9C27B0' },
      { nome: 'Teatro', icone: 'musical-notes', cor: '#9C27B0' },
      { nome: 'Shows', icone: 'musical-note', cor: '#9C27B0' },
      { nome: 'Jogos', icone: 'game-controller', cor: '#9C27B0' },
      { nome: 'Streaming', icone: 'tv', cor: '#9C27B0' },
      { nome: 'Viagens', icone: 'airplane', cor: '#9C27B0' },
      { nome: 'Hobbies', icone: 'color-palette', cor: '#9C27B0' },
      { nome: 'Esportes', icone: 'football', cor: '#9C27B0' }
    ]
  },
  { 
    nome: 'Vestuário', 
    icone: 'shirt', 
    cor: '#E91E63', 
    tipo: 'despesa',
    ordem: 7,
    subcategorias: [
      { nome: 'Roupas', icone: 'shirt', cor: '#E91E63' },
      { nome: 'Sapatos', icone: 'footsteps', cor: '#E91E63' },
      { nome: 'Acessórios', icone: 'watch', cor: '#E91E63' },
      { nome: 'Roupas Íntimas', icone: 'shirt', cor: '#E91E63' },
      { nome: 'Uniformes', icone: 'business', cor: '#E91E63' }
    ]
  },
  { 
    nome: 'Beleza', 
    icone: 'cut', 
    cor: '#E91E63', 
    tipo: 'despesa',
    ordem: 8,
    subcategorias: [
      { nome: 'Cabelo', icone: 'cut', cor: '#E91E63' },
      { nome: 'Estética', icone: 'flower', cor: '#E91E63' },
      { nome: 'Cosméticos', icone: 'color-palette', cor: '#E91E63' },
      { nome: 'Perfumes', icone: 'sparkles', cor: '#E91E63' },
      { nome: 'Manicure', icone: 'hand-left', cor: '#E91E63' }
    ]
  },
  { 
    nome: 'Tecnologia', 
    icone: 'phone-portrait', 
    cor: '#2196F3', 
    tipo: 'despesa',
    ordem: 9,
    subcategorias: [
      { nome: 'Celular', icone: 'phone-portrait', cor: '#2196F3' },
      { nome: 'Computador', icone: 'laptop', cor: '#2196F3' },
      { nome: 'Software', icone: 'code', cor: '#2196F3' },
      { nome: 'Acessórios', icone: 'headset', cor: '#2196F3' },
      { nome: 'Conserto', icone: 'construct', cor: '#2196F3' },
      { nome: 'Upgrade', icone: 'trending-up', cor: '#2196F3' }
    ]
  },
  { 
    nome: 'Serviços', 
    icone: 'build', 
    cor: '#009688', 
    tipo: 'despesa',
    ordem: 10,
    subcategorias: [
      { nome: 'Bancários', icone: 'card', cor: '#009688' },
      { nome: 'Contabilidade', icone: 'calculator', cor: '#009688' },
      { nome: 'Advocacia', icone: 'library', cor: '#009688' },
      { nome: 'Limpeza', icone: 'build', cor: '#009688' },
      { nome: 'Delivery', icone: 'bicycle', cor: '#009688' },
      { nome: 'Segurança', icone: 'shield', cor: '#009688' }
    ]
  },
  { 
    nome: 'Impostos', 
    icone: 'document-text', 
    cor: '#FF9800', 
    tipo: 'despesa',
    ordem: 11,
    subcategorias: [
      { nome: 'Imposto de Renda', icone: 'document-text', cor: '#FF9800' },
      { nome: 'IPVA', icone: 'car', cor: '#FF9800' },
      { nome: 'IPTU', icone: 'home', cor: '#FF9800' },
      { nome: 'Taxas', icone: 'receipt', cor: '#FF9800' },
      { nome: 'Multas', icone: 'warning', cor: '#FF9800' }
    ]
  },
  { 
    nome: 'Investimentos', 
    icone: 'trending-up', 
    cor: '#4CAF50', 
    tipo: 'despesa',
    ordem: 12,
    subcategorias: [
      { nome: 'Poupança', icone: 'wallet', cor: '#4CAF50' },
      { nome: 'Renda Fixa', icone: 'bar-chart', cor: '#4CAF50' },
      { nome: 'Renda Variável', icone: 'stats-chart', cor: '#4CAF50' },
      { nome: 'Previdência', icone: 'shield', cor: '#4CAF50' },
      { nome: 'Criptomoedas', icone: 'logo-bitcoin', cor: '#4CAF50' }
    ]
  },
  { 
    nome: 'Pets', 
    icone: 'paw', 
    cor: '#795548', 
    tipo: 'despesa',
    ordem: 13,
    subcategorias: [
      { nome: 'Ração', icone: 'nutrition', cor: '#795548' },
      { nome: 'Veterinário', icone: 'medical', cor: '#795548' },
      { nome: 'Medicamentos', icone: 'medical', cor: '#795548' },
      { nome: 'Higiene', icone: 'water', cor: '#795548' },
      { nome: 'Brinquedos', icone: 'football', cor: '#795548' },
      { nome: 'Hotel Pet', icone: 'home', cor: '#795548' }
    ]
  },
  { 
    nome: 'Doações', 
    icone: 'heart', 
    cor: '#E91E63', 
    tipo: 'despesa',
    ordem: 14,
    subcategorias: [
      { nome: 'Caridade', icone: 'heart', cor: '#E91E63' },
      { nome: 'Igreja', icone: 'business', cor: '#E91E63' },
      { nome: 'ONG', icone: 'people', cor: '#E91E63' },
      { nome: 'Causas Sociais', icone: 'globe', cor: '#E91E63' }
    ]
  },
  { 
    nome: 'Empréstimos', 
    icone: 'card', 
    cor: '#FF5722', 
    tipo: 'despesa',
    ordem: 15,
    subcategorias: [
      { nome: 'Empréstimo Pessoal', icone: 'person', cor: '#FF5722' },
      { nome: 'Cartão de Crédito', icone: 'card', cor: '#FF5722' },
      { nome: 'Financiamento', icone: 'home', cor: '#FF5722' },
      { nome: 'Cheque Especial', icone: 'checkbook', cor: '#FF5722' }
    ]
  },
  { 
    nome: 'Outros', 
    icone: 'ellipsis-horizontal', 
    cor: '#9E9E9E', 
    tipo: 'despesa',
    ordem: 16,
    subcategorias: [
      { nome: 'Diversos', icone: 'apps', cor: '#9E9E9E' },
      { nome: 'Emergências', icone: 'alert-circle', cor: '#9E9E9E' },
      { nome: 'Presentes', icone: 'gift', cor: '#9E9E9E' },
      { nome: 'Festas', icone: 'balloon', cor: '#9E9E9E' }
    ]
  }
]

export const createDefaultCategories = async () => {
  const { mutate } = useMutation()
  
  try {
    // Primeiro, tentar usar o endpoint de recriar padrões se existir
    try {
      await mutate('post', '/categories/recriar-padroes', {})
      console.log('✅ Categorias padrão criadas via endpoint')
      return true
    } catch (error) {
      console.log('⚠️ Endpoint recriar-padroes não disponível, criando manualmente...')
    }
    
    // Se não funcionar, criar manualmente
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
    
    let created = 0
    for (const category of allCategories) {
      try {
        await mutate('post', '/categories', category)
        created++
        console.log(`✅ Categoria criada: ${category.nome}`)
      } catch (error: any) {
        // Se a categoria já existe, não é um erro
        if (error.message?.includes('já existe')) {
          console.log(`ℹ️ Categoria já existe: ${category.nome}`)
        } else {
          console.error(`❌ Erro ao criar categoria ${category.nome}:`, error)
        }
      }
    }
    
    console.log(`✅ ${created} categorias criadas com sucesso`)
    return true
    
  } catch (error) {
    console.error('❌ Erro ao criar categorias padrão:', error)
    return false
  }
}

// Hook personalizado para verificar e criar categorias
export const useEnsureCategories = () => {
  const [categoriesChecked, setCategoriesChecked] = React.useState(false)
  
  const checkAndCreateCategories = async () => {
    if (categoriesChecked) return
    
    try {
      // Verificar se já existem categorias
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success && data.data && data.data.length === 0) {
        console.log('📝 Nenhuma categoria encontrada, criando categorias padrão...')
        await createDefaultCategories()
      }
      
      setCategoriesChecked(true)
    } catch (error) {
      console.error('❌ Erro ao verificar categorias:', error)
    }
  }
  
  return { checkAndCreateCategories, categoriesChecked }
}

// Função para obter todas as categorias padrão (útil para sincronização)
export const getAllDefaultCategories = () => {
  return [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
}

// Função para obter categorias por tipo
export const getDefaultCategoriesByType = (tipo: 'receita' | 'despesa') => {
  if (tipo === 'receita') {
    return DEFAULT_INCOME_CATEGORIES
  }
  return DEFAULT_EXPENSE_CATEGORIES
}

// Função para buscar categoria por nome
export const findCategoryByName = (name: string) => {
  const all = getAllDefaultCategories()
  return all.find(cat => cat.nome.toLowerCase() === name.toLowerCase())
}

// Função para buscar subcategoria por nome
export const findSubcategoryByName = (categoryName: string, subcategoryName: string) => {
  const category = findCategoryByName(categoryName)
  if (!category?.subcategorias) return null
  
  return category.subcategorias.find(sub => 
    sub.nome.toLowerCase() === subcategoryName.toLowerCase()
  )
}