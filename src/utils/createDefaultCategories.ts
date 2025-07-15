// src/utils/createDefaultCategories.ts
import React from 'react'
import { useMutation } from '../hooks/useApi'

// Categorias padrão para receitas
const DEFAULT_INCOME_CATEGORIES = [
  { nome: 'Salário', icone: 'briefcase', cor: '#4CAF50', tipo: 'receita' },
  { nome: 'Freelance', icone: 'laptop', cor: '#2196F3', tipo: 'receita' },
  { nome: 'Investimentos', icone: 'trending-up', cor: '#9C27B0', tipo: 'receita' },
  { nome: 'Vendas', icone: 'storefront', cor: '#FF9800', tipo: 'receita' },
  { nome: 'Bonificação', icone: 'gift', cor: '#E91E63', tipo: 'receita' },
]

// Categorias padrão para despesas
const DEFAULT_EXPENSE_CATEGORIES = [
  { nome: 'Alimentação', icone: 'restaurant', cor: '#FF5722', tipo: 'despesa' },
  { nome: 'Transporte', icone: 'car', cor: '#607D8B', tipo: 'despesa' },
  { nome: 'Moradia', icone: 'home', cor: '#795548', tipo: 'despesa' },
  { nome: 'Saúde', icone: 'medical', cor: '#F44336', tipo: 'despesa' },
  { nome: 'Educação', icone: 'school', cor: '#3F51B5', tipo: 'despesa' },
  { nome: 'Lazer', icone: 'game-controller', cor: '#9C27B0', tipo: 'despesa' },
  { nome: 'Compras', icone: 'bag', cor: '#E91E63', tipo: 'despesa' },
  { nome: 'Serviços', icone: 'build', cor: '#009688', tipo: 'despesa' },
  { nome: 'Outros', icone: 'ellipsis-horizontal', cor: '#757575', tipo: 'despesa' },
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