// src/components/DebugConnection.tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const DebugConnection = () => {
  const { theme } = useTheme()
  const [results, setResults] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const testEndpoints = async () => {
    setTesting(true)
    setResults([])
    
    // Lista de endpoints para testar
    const endpoints = [
      'http://localhost:5001/health',
      'http://localhost:5001/api/categories', 
      'http://10.0.2.2:5001/health', // Android Emulator
      'http://10.0.2.2:5001/api/categories',
      'http://192.168.1.100:5001/health', // Sua rede local (substitua pelo seu IP)
      'http://192.168.1.100:5001/api/categories',
    ]

    const newResults: string[] = []

    for (const endpoint of endpoints) {
      try {
        newResults.push(`🧪 Testando: ${endpoint}`)
        setResults([...newResults])

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          newResults.push(`✅ SUCESSO: ${endpoint}`)
          newResults.push(`   Status: ${response.status}`)
          newResults.push(`   Data: ${JSON.stringify(data).substring(0, 100)}...`)
          
          // Se encontrou um endpoint que funciona, mostrar alerta
          Alert.alert(
            'Conexão Encontrada!', 
            `Endpoint funcionando: ${endpoint}`,
            [{ text: 'OK' }]
          )
        } else {
          newResults.push(`⚠️ ERRO HTTP: ${endpoint} - Status: ${response.status}`)
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          newResults.push(`⏰ TIMEOUT: ${endpoint}`)
        } else {
          newResults.push(`❌ ERRO: ${endpoint} - ${error.message}`)
        }
      }
      
      setResults([...newResults])
      // Pequena pausa entre os testes
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setTesting(false)
    newResults.push('\n🏁 Testes concluídos!')
    setResults([...newResults])
  }

  const clearResults = () => {
    setResults([])
  }

  const getLocalIP = async () => {
    try {
      // Método para tentar descobrir o IP local
      Alert.prompt(
        'IP da sua máquina',
        'Digite o IP da sua máquina (ex: 192.168.1.100):',
        (ip) => {
          if (ip) {
            Alert.alert('IP Configurado', `Agora teste: http://${ip}:5001/api/categories`)
          }
        }
      )
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter o IP automaticamente')
    }
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      margin: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: theme.primary,
      padding: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.primary,
    },
    buttonSecondary: {
      backgroundColor: theme.error,
    },
    buttonTertiary: {
      backgroundColor: '#4ECDC4',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
      textAlign: 'center',
    },
    resultsContainer: {
      maxHeight: 300,
      backgroundColor: '#f8f9fa',
      margin: 16,
      borderRadius: 8,
      padding: 12,
    },
    resultText: {
      fontSize: 11,
      marginBottom: 2,
      fontFamily: 'monospace',
      color: '#333',
    },
    resultSuccess: {
      color: '#28a745',
    },
    resultError: {
      color: '#dc3545',
    },
    resultWarning: {
      color: '#ffc107',
    },
    instructionsContainer: {
      backgroundColor: '#e3f2fd',
      margin: 16,
      padding: 16,
      borderRadius: 8,
    },
    instructionsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1976d2',
      marginBottom: 8,
    },
    instructionsText: {
      fontSize: 12,
      color: '#424242',
      lineHeight: 18,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Debug de Conectividade</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]}
          onPress={testEndpoints}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? '🔄 Testando...' : '🧪 Testar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Limpar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonTertiary]}
          onPress={getLocalIP}
        >
          <Text style={styles.buttonText}>🌐 IP</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {results.map((result, index) => (
            <Text 
              key={index} 
              style={[
                styles.resultText,
                result.includes('✅') && styles.resultSuccess,
                result.includes('❌') && styles.resultError,
                result.includes('⚠️') && styles.resultWarning,
              ]}
            >
              {result}
            </Text>
          ))}
        </ScrollView>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📝 Como usar:</Text>
        <Text style={styles.instructionsText}>
          1. Clique em "Testar" para verificar conectividade{'\n'}
          2. Procure por endpoints com ✅{'\n'}
          3. Se nenhum funcionar, clique em "IP" para configurar manualmente{'\n'}
          4. Para descobrir seu IP: CMD → ipconfig (Windows) ou ifconfig (Mac/Linux)
        </Text>
      </View>
    </View>
  )
}

export default DebugConnection