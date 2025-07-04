import React, { useState, forwardRef } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: keyof typeof Ionicons.glyphMap
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
  variant?: 'default' | 'filled' | 'outlined'
  size?: 'small' | 'medium' | 'large'
  containerStyle?: ViewStyle
  required?: boolean
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  containerStyle,
  required = false,
  style,
  secureTextEntry,
  ...props
}, ref) => {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry)

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12
        baseStyle.paddingVertical = 8
        baseStyle.minHeight = 40
        break
      case 'large':
        baseStyle.paddingHorizontal = 16
        baseStyle.paddingVertical = 16
        baseStyle.minHeight = 56
        break
      default: // medium
        baseStyle.paddingHorizontal = 14
        baseStyle.paddingVertical = 12
        baseStyle.minHeight = 48
    }

    // Variant styles
    switch (variant) {
      case 'filled':
        baseStyle.backgroundColor = theme.surface
        baseStyle.borderColor = 'transparent'
        break
      case 'outlined':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderColor = error ? theme.error : isFocused ? theme.primary : theme.border
        break
      default: // default
        baseStyle.backgroundColor = theme.surface
        baseStyle.borderColor = theme.border
    }

    // Focus state
    if (isFocused && !error) {
      baseStyle.borderColor = theme.primary
      baseStyle.borderWidth = 2
    }

    // Error state
    if (error) {
      baseStyle.borderColor = theme.error
      baseStyle.borderWidth = 2
    }

    return baseStyle
  }

  const iconSize = size === 'small' ? 18 : size === 'large' ? 22 : 20
  const iconColor = error ? theme.error : isFocused ? theme.primary : theme.textSecondary

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const styles = StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    label: {
      fontSize: size === 'small' ? 14 : 16,
      fontWeight: '500',
      color: theme.text,
    },
    required: {
      color: theme.error,
      marginLeft: 2,
    },
    inputContainer: getContainerStyle(),
    leftIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      color: theme.text,
      fontWeight: '400',
    },
    rightIcon: {
      marginLeft: 12,
      padding: 4,
    },
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: 4,
      marginLeft: 4,
    },
  })

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={iconSize} 
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={handlePasswordToggle}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={iconSize} 
              color={iconColor}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity 
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={rightIcon} 
              size={iconSize} 
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  )
})

Input.displayName = 'Input'

export default Input