import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'
import Toast from 'react-native-toast-message'

// Configuração base da API
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Desenvolvimento
  : 'https://your-api-domain.com/api'  // Produção

const API_TIMEOUT = 10000

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
  }

  private setupInterceptors() {
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
      (error) => {
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
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              await SecureStore.setItemAsync('token', response.data.token)
              
              // Retry original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${response.data.token}`
              }
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearAuthData()
            this.showErrorToast('Sessão expirada. Faça login novamente.')
            // Aqui você pode disparar um evento para redirecionar para login
            return Promise.reject(refreshError)
          }
        }

        // Tratar outros erros
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private async refreshToken(refreshToken: string) {
    return axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken
    })
  }

  private async clearAuthData() {
    try {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('refreshToken')
    } catch (error) {
      console.log('Erro ao limpar dados de autenticação:', error)
    }
  }

  private handleApiError(error: AxiosError) {
    const response = error.response
    const data = response?.data as any

    let message = 'Erro inesperado. Tente novamente.'

    if (response) {
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
    } else if (error.code === 'ECONNABORTED') {
      message = 'Tempo limite excedido. Verifique sua conexão.'
    } else if (error.message === 'Network Error') {
      message = 'Erro de conexão. Verifique sua internet.'
    }

    this.showErrorToast(message)
  }

  private showErrorToast(message: string) {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: message,
      visibilityTime: 4000,
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
      await this.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

// Instância singleton
export const apiService = new ApiService()
export default apiService