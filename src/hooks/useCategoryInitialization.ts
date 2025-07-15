// src/hooks/useCategoryInitialization.ts
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCategorias } from '../utils/categoryManager'
import { createDefaultCategories } from '../utils/createDefaultCategories'

const CATEGORIES_INITIALIZED_KEY = '@categories_initialized'

export const useCategoryInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const { categorias, refetch } = useCategorias()

  useEffect(() => {
    checkAndInitializeCategories()
  }, [])

  const checkAndInitializeCategories = async () => {
    try {
      setIsInitializing(true)

      // Verificar se já foi inicializado anteriormente
      const wasInitialized = await AsyncStorage.getItem(CATEGORIES_INITIALIZED_KEY)
      
      // Se já tem categorias ou já foi inicializado, marcar como completo
      if (categorias.length > 0 || wasInitialized === 'true') {
        setIsInitialized(true)
        setIsInitializing(false)
        return
      }

      // Inicializar categorias padrão
      console.log('🚀 Inicializando categorias padrão...')
      const success = await createDefaultCategories()
      
      if (success) {
        // Marcar como inicializado
        await AsyncStorage.setItem(CATEGORIES_INITIALIZED_KEY, 'true')
        
        // Recarregar categorias
        await refetch()
        
        console.log('✅ Categorias inicializadas com sucesso')
        setIsInitialized(true)
      } else {
        console.error('❌ Falha ao inicializar categorias')
      }
    } catch (error) {
      console.error('❌ Erro durante inicialização de categorias:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const resetInitialization = async () => {
    try {
      await AsyncStorage.removeItem(CATEGORIES_INITIALIZED_KEY)
      setIsInitialized(false)
      console.log('🔄 Status de inicialização resetado')
    } catch (error) {
      console.error('❌ Erro ao resetar inicialização:', error)
    }
  }

  const forceInitialization = async () => {
    try {
      setIsInitializing(true)
      await resetInitialization()
      await checkAndInitializeCategories()
    } catch (error) {
      console.error('❌ Erro na inicialização forçada:', error)
      setIsInitializing(false)
    }
  }

  return {
    isInitialized,
    isInitializing,
    totalCategories: categorias.length,
    checkAndInitializeCategories,
    resetInitialization,
    forceInitialization
  }
}