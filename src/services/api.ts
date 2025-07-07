import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'
import Toast from 'react-native-toast-message'
import { Platform } from 'react-native'

// ⚠️ CONFIGURAÇÃO CRÍTICA - ALTERE AQUI SEU IP LOCAL
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Para descobrir seu IP: 
    // Windows: ipconfig
    // Mac/Linux: ifconfig
    
    // ALTERE ESTE IP PARA O SEU IP LOCAL!
    const LOCAL_IP = '192.168.0.101' // ⚠️ MUDE AQUI!
    
    if (Platform.OS === 'android') {
      // Para Android real, use seu IP da rede local
      return `http://${LOCAL_IP}:5000/api`
    } else if (Platform.OS === 'ios') {
      // Para iOS, também use IP da rede local
      return `http://${LOCAL_IP}:5000/api`
    } else {
      // Para web/emulador, localhost funciona
      return 'http://localhost:5000/api'
    }
  } else {
    // Produção
    return 'https://your-api-domain.com/api'
  }
}

const API_BASE_URL = getApiBaseUrl()
const API_TIMEOUT = 15000 // Aumentado para 15 segundos

console.log('🔗 API Base URL:', API_BASE_URL)

interface ApiError {
  message: string
  code?: string
  details?: any
}

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    
    // Teste de conectividade na inicialização
    this.testConnection()
  }

  private async testConnection() {
    try {
      console.log('🧪 Testando conexão com backend...')
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
        timeout: 5000
      })
      console.log('✅ Backend conectado:', response.data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ Erro de conexão com backend:', errorMessage)
      console.error('🔍 Verifique se:')
      console.error('   1. O backend está rodando (npm run dev)')
      console.error('   2. O IP está correto no api.ts')
      console.error('   3. Dispositivo e backend estão na mesma rede')
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          console.log('Erro ao obter token:', errorMessage)
        }
        
        // Log detalhado
        if (__DEV__) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
          if (config.data) {
            const logData = { ...config.data }
            if (logData.senha) logData.senha = '***'
            if (logData.password) logData.password = '***'
            console.log('📦 Data:', JSON.stringify(logData, null, 2))
          }
        }
        
        return config
      },
      (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`✅ ${response.status} ${response.config.url}`)
          if (response.data) {
            console.log('📥 Response:', JSON.stringify(response.data, null, 2))
          }
        }
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Log detalhado de erros
        if (__DEV__) {
          console.error('❌ API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data
          })
        }

        // Tratar erro 401 (token expirado)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken')
            const userId = await SecureStore.getItemAsync('userId')
            
            if (refreshToken && userId) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken,
                userId
              })
              
              const newToken = response.data.data.token
              await SecureStore.setItemAsync('token', newToken)
              
              // Retry request original
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
              }
              return this.api(originalRequest)
            }
          } catch (refreshError: unknown) {
            console.error('❌ Refresh token failed:', refreshError)
            await this.clearAuthData()
            this.showErrorToast('Sessão expirada. Faça login novamente.')
            return Promise.reject(refreshError)
          }
        }

        // Tratar outros erros
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private async clearAuthData() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('token'),
        SecureStore.deleteItemAsync('refreshToken'),
        SecureStore.deleteItemAsync('userId')
      ])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.log('Erro ao limpar dados de autenticação:', errorMessage)
    }
  }

  private handleApiError(error: AxiosError) {
    const response = error.response
    const data = response?.data as any

    let message = 'Erro inesperado. Tente novamente.'

    if (!response) {
      // Erro de rede
      if (error.code === 'ECONNABORTED') {
        message = 'Tempo limite excedido. Verifique sua conexão.'
      } else if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        message = 'Erro de conexão. Verifique se o backend está rodando e o IP está correto.'
      } else {
        message = `Erro de rede: ${error.message}`
      }
    } else {
      // Erro de resposta HTTP
      switch (response.status) {
        case 400:
          message = data?.error || 'Dados inválidos'
          break
        case 401:
          message = 'Acesso não autorizado'
          break
        case 403:
          message = 'Acesso negado'
          break
        case 404:
          message = 'Recurso não encontrado'
          break
        case 422:
          message = data?.error || 'Dados inválidos'
          break
        case 429:
          message = 'Muitas tentativas. Tente novamente em alguns minutos.'
          break
        case 500:
          message = 'Erro interno do servidor'
          break
        default:
          message = data?.error || `Erro ${response.status}`
      }
    }

    this.showErrorToast(message)
  }

  private showErrorToast(message: string) {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: message,
      visibilityTime: 5000,
    })
  }

  // Métodos públicos para fazer requisições
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config)
    return response.data
  }

  // Método para upload de arquivos
  async upload<T = any>(url: string, formData: FormData, onUploadProgress?: (progress: number) => void): Promise<T> {
    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onUploadProgress(Math.round(progress))
        }
      },
    })
    return response.data
  }

  // Verificar conectividade
  async checkConnectivity(): Promise<boolean> {
    try {
      await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
        timeout: 5000
      })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  // Método para testar backend manualmente
  async testBackend(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testando backend em:', API_BASE_URL)
      
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
        timeout: 10000
      })
      
      return {
        success: true,
        message: 'Backend conectado com sucesso!',
        data: response.data
      }
    } catch (error: unknown) {
      let message = 'Erro desconhecido'
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
          message = 'Não foi possível conectar ao backend. Verifique se está rodando e o IP está correto.'
        } else if (error.code === 'ECONNABORTED') {
          message = 'Timeout na conexão. Backend muito lento ou indisponível.'
        } else {
          message = error.message || 'Erro na conexão'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      
      return {
        success: false,
        message,
        data: axios.isAxiosError(error) ? error.response?.data : undefined
      }
    }
  }
}

// Instância singleton
export const apiService = new ApiService()
export default apiService