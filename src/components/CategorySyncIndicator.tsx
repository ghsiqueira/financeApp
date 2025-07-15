// src/components/CategorySyncIndicator.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { useCategorySync } from '../utils/categorySync'
import { CategoryInitializer } from './CategoryInitializer'

export const CategorySyncIndicator: React.FC = () => {
  const { theme } = useTheme()
  const { isSyncing, lastSyncDate, syncCategories } = useCategorySync()
  
  const styles = createStyles(theme)

  const formatSyncDate = (date: Date | null) => {
    if (!date) return 'Nunca'
    
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Agora há pouco'
    if (diffHours < 24) return `${diffHours}h atrás`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Ionicons 
          name={isSyncing ? 'sync' : 'checkmark-circle'} 
          size={16} 
          color={isSyncing ? theme.warning : theme.success}
          style={isSyncing ? styles.rotating : undefined}
        />
        <Text style={styles.text}>
          {isSyncing ? 'Sincronizando...' : `Últ. sync: ${formatSyncDate(lastSyncDate)}`}
        </Text>
      </View>
      
      {!isSyncing && (
        <TouchableOpacity onPress={() => syncCategories(true)}>
          <Ionicons name="refresh" size={16} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  text: {
    fontSize: 12,
    color: theme.textSecondary
  },
  rotating: {
    // Adicionar animação de rotação se necessário
  }
})

export default CategoryInitializer