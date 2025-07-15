// src/components/CategoryInitializer.tsx
import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useCategoryInitialization } from '../hooks/useCategoryInitialization'

interface CategoryInitializerProps {
  children: React.ReactNode
  showLoading?: boolean
}

export const CategoryInitializer: React.FC<CategoryInitializerProps> = ({ 
  children, 
  showLoading = true 
}) => {
  const { theme } = useTheme()
  const { isInitialized, isInitializing, totalCategories } = useCategoryInitialization()

  const styles = createStyles(theme)

  if (isInitializing && showLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Inicializando categorias...</Text>
        <Text style={styles.loadingSubtext}>
          Criando categorias padrão para organizar suas finanças
        </Text>
      </View>
    )
  }

  if (!isInitialized && totalCategories === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Configurando seu app</Text>
        <Text style={styles.emptyText}>
          Aguarde enquanto preparamos as categorias para você...
        </Text>
        <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
      </View>
    )
  }

  return <>{children}</>
}

const createStyles = (theme: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 40
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 20,
    textAlign: 'center'
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22
  },
  spinner: {
    marginTop: 20
  }
})
