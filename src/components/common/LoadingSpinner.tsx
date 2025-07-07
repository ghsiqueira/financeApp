import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  style?: any
}

export default function LoadingSpinner({ 
  size = 'large', 
  color, 
  style 
}: LoadingSpinnerProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={color || theme.primary} 
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})