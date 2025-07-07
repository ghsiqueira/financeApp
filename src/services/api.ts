// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'
import Toast from 'react-native-toast-message'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

interface ConnectionTest {
  ip: string
  port: string
  working: boolean
  responseTime: number
}

interface ApiError {
  message: string
  code?: string
  details?: any
}

class SmartApiService {
  private api: AxiosInstance | null = null
  private currentBaseURL: string = ''
  private connectionTests: ConnectionTest[] = []
  private isInitialized: boolean = false
  private isInitializing: boolean = false

  constructor() {
    this.initializeApi()
  }

  private async initializeApi() {
    if (this.isInitialized || this.isInitializing) return
    this.isInitializing = true

    console.log('🔍 Iniciando detecção automática de IP do servidor...')
    
    try {
      const workingBaseURL = await this.findWorkingConnection()
      
      if (workingBaseURL) {
        this.currentBaseURL = workingBaseURL
        this.createApiInstance()
        this.isInitialized = true
        console.log(`✅ API configurada com sucesso: ${this.currentBaseURL}`)
        
        // Mostrar toast de sucesso apenas se não estivermos em desenvolvimento silencioso
        if (__DEV__) {
          Toast.show({
            type: 'success',
            text1: 'Conectado!',
            text2: 'Servidor encontrado automaticamente',
            visibilityTime: 2000
          })
        }
      } else {
        console.log('❌ Nenhuma conexão funcionando encontrada')
        this.fallbackToDefault()
      }
    } catch (error: any) {
      console.error('❌ Erro durante inicialização da API:', error?.message || error)
      this.fallbackToDefault()
    } finally {
      this.isInitializing = false
    }
  }

  private async findWorkingConnection(): Promise<string | null> {
    const port = '5001'  // Mudou de 5000 para 5001
    const testIPs = this.generateTestIPs()
    
    console.log('🧪 Testando conectividade com IPs:', testIPs)
    
    // Testa todos os IPs em paralelo com timeout curto
    const testPromises = testIPs.map(ip => this.testConnection(ip, port))
    const results = await Promise.allSettled(testPromises)
    
    // Filtra apenas os sucessos e ordena por velocidade de resposta
    const workingConnections = results
      .map((result, index) => ({
        ip: testIPs[index],
        success: result.status === 'fulfilled' && result.value.working,
        responseTime: result.status === 'fulfilled' ? result.value.responseTime : Infinity
      }))
      .filter(conn => conn.success)
      .sort((a, b) => a.responseTime - b.responseTime)
    
    console.log('✅ Conexões funcionais encontradas:', workingConnections.length)
    
    if (workingConnections.length > 0) {
      const bestConnection = workingConnections[0]
      console.log(`🏆 Melhor conexão: ${bestConnection.ip} (${bestConnection.responseTime}ms)`)
      
      // Salvar todos os testes para debug
      this.connectionTests = results
        .map((result, index) => result.status === 'fulfilled' ? result.value : {
          ip: testIPs[index],
          port,
          working: false,
          responseTime: Infinity
        })
      
      return `http://${bestConnection.ip}:${port}/api`
    }
    
    return null
  }

  private generateTestIPs(): string[] {
    const ips = new Set<string>()
    
    // 1. IP detectado do Expo (mais provável de funcionar)
    const expoIP = this.getExpoIP()
    if (expoIP && expoIP !== 'localhost' && expoIP !== '127.0.0.1') {
      ips.add(expoIP)
    }
    
    // 2. IPs padrão baseado na plataforma
    if (Platform.OS === 'android') {
      ips.add('10.0.2.2') // Emulador Android padrão
      ips.add('10.0.3.2') // Genymotion
    } else {
      ips.add('localhost')
      ips.add('127.0.0.1')
    }
    
    // 3. IPs comuns de rede local (baseado em ranges mais comuns)
    const commonIPs = [
      '192.168.1.1',   // Router mais comum
      '192.168.0.1',   // Segundo router mais comum
      '192.168.1.100', // IP comum para computadores
      '192.168.0.100', // IP comum para computadores
      '192.168.1.10',  // IP comum para computadores
      '192.168.0.10',  // IP comum para computadores
      '172.16.0.1',    // Rede privada classe B
      '10.0.0.1',      // Rede privada classe A
    ]
    
    commonIPs.forEach(ip => ips.add(ip))
    
    // 4. Adicionar o IP do Expo por último se for localhost
    if (expoIP && (expoIP === 'localhost' || expoIP === '127.0.0.1')) {
      ips.add(expoIP)
    }
    
    return Array.from(ips)
  }

  private getExpoIP(): string | null {
    try {
      // Múltiplas tentativas de obter o IP do Expo
      const sources = [
        Constants.expoConfig?.hostUri,
        (Constants.manifest as any)?.debuggerHost,
        (Constants.expoConfig as any)?.debuggerHost,
        (Constants.manifest2 as any)?.extra?.expoClient?.hostUri
      ]
      
      for (const source of sources) {
        if (source) {
          const ip = source.split(':')[0]
          if (ip && ip !== '') {
            console.log('📱 IP detectado do Expo:', ip)
            return ip
          }
        }
      }
      
      return null
    } catch (error: any) {
      console.log('⚠️  Erro ao obter IP do Expo:', error?.message || error)
      return null
    }
  }

  private async testConnection(ip: string, port: string): Promise<ConnectionTest> {
    const startTime = Date.now()
    const testURL = `http://${ip}:${port}/health`
    
    try {
      // Usar fetch com timeout mais agressivo para teste rápido
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(testURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      const working = response.ok
      
      if (working) {
        console.log(`✅ ${ip}:${port} - ${responseTime}ms - OK`)
      } else {
        console.log(`⚠️  ${ip}:${port} - ${responseTime}ms - Status: ${response.status}`)
      }
      
      return {
        ip,
        port,
        working,
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.log(`❌ ${ip}:${port} - ${responseTime}ms - ${(error as any)?.name || 'Erro'}`)
      
      return {
        ip,
        port,
        working: false,
        responseTime
      }
    }
  }

  private fallbackToDefault() {
    console.log('⚠️  Usando configuração padrão baseada na plataforma')
    
    if (Platform.OS === 'android') {
      this.currentBaseURL = 'http://10.0.2.2:5001/api'  // Mudou para porta 5001
      console.log('📱 Android: Usando IP do emulador (10.0.2.2:5001)')
    } else {
      this.currentBaseURL = 'http://localhost:5001/api'  // Mudou para porta 5001
      console.log('📱 iOS: Usando localhost:5001')
    }
    
    this.createApiInstance()
    this.isInitialized = true
    
    // Mostrar toast de aviso
    Toast.show({
      type: 'warning',
      text1: 'Usando configuração padrão',
      text2: 'Verifique se o servidor está rodando na porta 5001',
      visibilityTime: 3000
    })
  }

  private createApiInstance() {
    this.api = axios.create({
      baseURL: this.currentBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    if (!this.api) return

    // Request interceptor - adicionar token de autenticação
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error) {
          console.log('Erro ao obter token:', error)
        }
        
        // Log de requisições em desenvolvimento
        if (__DEV__) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
        }
        
        return config
      },
      (error: any) => {
        console.error('❌ Erro no request interceptor:', error?.message || error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - tratar respostas e erros
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log de respostas em desenvolvimento
        if (__DEV__) {
          console.log(`✅ ${response.status} ${response.config.url}`)
        }
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Log de erros em desenvolvimento
        if (__DEV__) {
          console.log(`❌ ${error.response?.status} ${error.config?.url}`)
          console.log('Error details:', error.response?.data)
        }

        // Tratar erro 401 (token expirado)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken')
            if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
              const response = await this.refreshToken(refreshToken)
              const newToken = response.data.token
              
              // Validar token antes de salvar
              if (newToken && typeof newToken === 'string') {
                await SecureStore.setItemAsync('token', newToken)
                
                // Retry original request
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`
                }
                return this.api!(originalRequest)
              }
            }
          } catch (refreshError: any) {
            // Refresh failed, redirect to login
            await this.clearAuthData()
            this.showErrorToast('Sessão expirada. Faça login novamente.')
            return Promise.reject(refreshError)
          }
        }

        // Se der erro de rede, tenta reconectar
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          console.log('🔄 Erro de rede detectado, tentando reconectar...')
          await this.reconnect()
        }

        // Tratar outros erros
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private async clearAuthData() {
    try {
      // Verificar se os itens existem antes de tentar deletar
      const token = await SecureStore.getItemAsync('token')
      const refreshToken = await SecureStore.getItemAsync('refreshToken')
      
      if (token) {
        await SecureStore.deleteItemAsync('token')
      }
      
      if (refreshToken) {
        await SecureStore.deleteItemAsync('refreshToken')
      }
    } catch (error: any) {
      console.log('Erro ao limpar dados de autenticação:', error?.message || error)
    }
  }

  private showErrorToast(message: string) {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: message,
      position: 'top',
    })
  }

  private handleApiError(error: AxiosError) {
    if (error.code === 'ECONNABORTED') {
      this.showErrorToast('Timeout - Servidor demorou para responder')
    } else if (error.code === 'NETWORK_ERROR') {
      this.showErrorToast('Erro de rede - Verifique se o servidor está rodando')
    } else if (error.response?.status === 500) {
      this.showErrorToast('Erro interno do servidor')
    } else if (error.response?.status === 404) {
      this.showErrorToast('Recurso não encontrado')
    } else if (error.response?.status === 403) {
      this.showErrorToast('Acesso negado')
    }
  }

  // Método para refresh token
  private async refreshToken(refreshToken: string) {
    const response = await axios.post(`${this.currentBaseURL}/auth/refresh`, {
      refreshToken
    })
    return response
  }

  private async reconnect() {
    console.log('🔄 Iniciando processo de reconexão...')
    this.isInitialized = false
    this.isInitializing = false
    await this.initializeApi()
  }

  // Método para forçar nova detecção
  async forceRedetection() {
    console.log('🔄 Forçando nova detecção de IP...')
    this.isInitialized = false
    this.isInitializing = false
    await this.initializeApi()
  }

  // Getter para a instância do axios
  get instance(): AxiosInstance {
    if (!this.api) {
      console.log('⚠️  API não inicializada, usando configuração padrão')
      this.fallbackToDefault()
    }
    return this.api!
  }

  // Informações de debug
  getDebugInfo() {
    return {
      currentBaseURL: this.currentBaseURL,
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      platform: Platform.OS,
      connectionTests: this.connectionTests,
      expoIP: this.getExpoIP(),
      expoConstants: {
        hostUri: Constants.expoConfig?.hostUri,
        debuggerHost: (Constants.manifest as any)?.debuggerHost,
        appOwnership: Constants.appOwnership
      }
    }
  }

  // Teste manual de conectividade
  async testCurrentConnection(): Promise<boolean> {
    try {
      const response = await this.instance.get('/health', { timeout: 5000 })
      return response.status === 200
    } catch (error: any) {
      console.log('❌ Teste de conectividade falhou:', error?.message || error)
      return false
    }
  }

  // Método para aguardar inicialização (útil para aguardar antes de fazer requests)
  async waitForInitialization(timeout = 10000): Promise<boolean> {
    const startTime = Date.now()
    
    while ((!this.isInitialized || this.isInitializing) && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return this.isInitialized && !this.isInitializing
  }
}

// Instância singleton
export const smartApiService = new SmartApiService()

// Função utilitária para aguardar a inicialização
export const waitForApiInitialization = async (timeout = 10000): Promise<void> => {
  const initialized = await smartApiService.waitForInitialization(timeout)
  
  if (!initialized) {
    throw new Error('API não conseguiu ser inicializada dentro do tempo limite')
  }
}

// Getter para a instância da API que aguarda inicialização
export const getApi = async (): Promise<AxiosInstance> => {
  await smartApiService.waitForInitialization()
  return smartApiService.instance
}

// API pronta para uso (aguarda inicialização automaticamente)
class ApiWrapper {
  private async getApiInstance(): Promise<AxiosInstance> {
    await smartApiService.waitForInitialization()
    return smartApiService.instance
  }

  async get(url: string, config?: AxiosRequestConfig) {
    const apiInstance = await this.getApiInstance()
    return apiInstance.get(url, config)
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const apiInstance = await this.getApiInstance()
    return apiInstance.post(url, data, config)
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    const apiInstance = await this.getApiInstance()
    return apiInstance.put(url, data, config)
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    const apiInstance = await this.getApiInstance()
    return apiInstance.delete(url, config)
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    const apiInstance = await this.getApiInstance()
    return apiInstance.patch(url, data, config)
  }
}

// Exporta a instância da API que aguarda inicialização
export const api = new ApiWrapper()

// Export padrão (para compatibilidade)
export default api