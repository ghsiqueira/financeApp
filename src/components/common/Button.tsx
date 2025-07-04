import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const { theme } = useTheme()

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 16
        baseStyle.paddingVertical = 8
        baseStyle.minHeight = 36
        break
      case 'large':
        baseStyle.paddingHorizontal = 24
        baseStyle.paddingVertical = 16
        baseStyle.minHeight = 56
        break
      default: // medium
        baseStyle.paddingHorizontal = 20
        baseStyle.paddingVertical = 12
        baseStyle.minHeight = 48
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = theme.primary
        baseStyle.borderColor = theme.primary
        break
      case 'secondary':
        baseStyle.backgroundColor = theme.secondary
        baseStyle.borderColor = theme.secondary
        break
      case 'outline':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderColor = theme.primary
        break
      case 'ghost':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderColor = 'transparent'
        break
      case 'danger':
        baseStyle.backgroundColor = theme.error
        baseStyle.borderColor = theme.error
        break
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.5
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%'
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    }

    // Size text styles
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = 14
        break
      case 'large':
        baseTextStyle.fontSize = 18
        break
      default: // medium
        baseTextStyle.fontSize = 16
    }

    // Variant text styles
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        baseTextStyle.color = '#FFFFFF'
        break
      case 'outline':
        baseTextStyle.color = theme.primary
        break
      case 'ghost':
        baseTextStyle.color = theme.text
        break
    }

    return baseTextStyle
  }

  const iconSize = size === 'small' ? 16 : size === 'large' ? 20 : 18
  const iconColor = variant === 'outline' ? theme.primary : 
                   variant === 'ghost' ? theme.text : '#FFFFFF'

  const handlePress = (event: any) => {
    if (!disabled && !loading && onPress) {
      onPress(event)
    }
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={{ marginRight: 8 }} 
            />
          )}
          
          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={{ marginLeft: 8 }} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  )
}