// src/utils/categorySync.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAllDefaultCategories } from './createDefaultCategories'
import { useMutation } from '../hooks/useApi'
import React from 'react'

const LAST_SYNC_KEY = '@categories_last_sync'
const SYNC_INTERVAL = 24 * 60 * 60 * 1000 // 24 horas

export class CategorySyncManager {
  private static instance: CategorySyncManager
  
  static getInstance(): CategorySyncManager {
    if (!CategorySyncManager.instance) {
      CategorySyncManager.instance = new CategorySyncManager()
    }
    return CategorySyncManager.instance
  }

  async shouldSync(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY)
      if (!lastSync) return true
      
      const timeDiff = Date.now() - parseInt(lastSync)
      return timeDiff > SYNC_INTERVAL
    } catch (error) {
      console.error('Erro ao verificar necessidade de sync:', error)
      return true
    }
  }

  async syncCategories(): Promise<boolean> {
    try {
      console.log('🔄 Iniciando sincronização de categorias...')
      
      const { mutate } = useMutation()
      
      // Buscar categorias do usuário
      const response = await fetch('/api/categories')
      const { data: userCategories } = await response.json()
      
      // Obter categorias padrão
      const defaultCategories = getAllDefaultCategories()
      
      // Verificar se há novas categorias padrão
      const newCategories = defaultCategories.filter(defaultCat => 
        !userCategories.some((userCat: any) => userCat.nome === defaultCat.nome)
      )
      
      if (newCategories.length > 0) {
        console.log(`📝 ${newCategories.length} novas categorias encontradas`)
        
        // Criar novas categorias
        for (const newCat of newCategories) {
          try {
            await mutate('post', '/categories', newCat)
            console.log(`✅ Nova categoria criada: ${newCat.nome}`)
          } catch (error) {
            console.error(`❌ Erro ao criar categoria ${newCat.nome}:`, error)
          }
        }
      }
      
      // Atualizar timestamp do último sync
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString())
      
      console.log('✅ Sincronização concluída')
      return true
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      return false
    }
  }

  async forceClearSync(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LAST_SYNC_KEY)
      console.log('🔄 Cache de sincronização limpo')
    } catch (error) {
      console.error('❌ Erro ao limpar cache de sync:', error)
    }
  }
}

// Hook para sincronização automática
export const useCategorySync = () => {
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [lastSyncDate, setLastSyncDate] = React.useState<Date | null>(null)
  
  const syncManager = CategorySyncManager.getInstance()

  const syncCategories = async (force = false) => {
    if (isSyncing) return false
    
    try {
      setIsSyncing(true)
      
      if (!force && !(await syncManager.shouldSync())) {
        console.log('ℹ️ Sync não necessário ainda')
        return true
      }
      
      const success = await syncManager.syncCategories()
      
      if (success) {
        setLastSyncDate(new Date())
      }
      
      return success
    } finally {
      setIsSyncing(false)
    }
  }

  const getLastSyncDate = async () => {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY)
      if (lastSync) {
        setLastSyncDate(new Date(parseInt(lastSync)))
      }
    } catch (error) {
      console.error('Erro ao obter data do último sync:', error)
    }
  }

  React.useEffect(() => {
    getLastSyncDate()
    
    // Sincronizar automaticamente na inicialização
    syncCategories()
  }, [])

  return {
    isSyncing,
    lastSyncDate,
    syncCategories,
    forceClearSync: syncManager.forceClearSync
  }
}