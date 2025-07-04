import React, { useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ActivityIndicator 
} from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

export default function LoadingScreen() {
  const { theme, isDark } = useTheme()
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Animação de rotação contínua para o ícone
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start()

    // Animação de pulse para o texto
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoContainer: {
      marginBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBackground: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: theme.shadow,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
    iconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
      lineHeight: 24,
    },
    loadingContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    loadingText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 16,
      fontWeight: '500',
    },
    dotsContainer: {
      flexDirection: 'row',
      marginTop: 12,
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginHorizontal: 3,
    },
    versionText: {
      position: 'absolute',
      bottom: 50,
      fontSize: 14,
      color: theme.textSecondary,
      opacity: 0.6,
    },
    backgroundCircle1: {
      position: 'absolute',
      width: width * 1.5,
      height: width * 1.5,
      borderRadius: width * 0.75,
      backgroundColor: theme.primary,
      opacity: 0.05,
      top: -width * 0.5,
      left: -width * 0.25,
    },
    backgroundCircle2: {
      position: 'absolute',
      width: width,
      height: width,
      borderRadius: width * 0.5,
      backgroundColor: theme.secondary,
      opacity: 0.03,
      bottom: -width * 0.3,
      right: -width * 0.3,
    },
  })

  const LoadingDots = () => {
    const [activeDot, setActiveDot] = React.useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setActiveDot(prev => (prev + 1) % 3)
      }, 500)

      return () => clearInterval(interval)
    }, [])

    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: activeDot === index ? 1 : 0.3,
                transform: [
                  {
                    scale: activeDot === index ? 1.2 : 1
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
    )
  }

  return (
    <LinearGradient
      colors={isDark 
        ? ['#000000', '#1a1a2e', '#16213e']
        : ['#ffffff', '#f8f9fa', '#e9ecef']
      }
      style={styles.container}
    >
      {/* Background decorative circles */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Animated.View 
              style={[
                styles.iconWrapper,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <Ionicons 
                name="wallet" 
                size={40} 
                color="#FFFFFF" 
              />
            </Animated.View>
          </View>
        </View>
        
        {/* Title and Subtitle */}
        <Text style={styles.title}>Finance App</Text>
        <Animated.Text 
          style={[
            styles.subtitle,
            {
              opacity: pulseAnim,
            },
          ]}
        >
          Sua gestão financeira{'\n'}pessoal inteligente
        </Animated.Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={theme.primary} 
          />
          <Text style={styles.loadingText}>Carregando...</Text>
          <LoadingDots />
        </View>
      </Animated.View>
      
      {/* Version */}
      <Text style={styles.versionText}>
        v1.0.0
      </Text>
    </LinearGradient>
  )
}