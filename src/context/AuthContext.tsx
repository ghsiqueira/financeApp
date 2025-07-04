import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authService } from '../services/authService'
import { User } from '../types/auth'

interface AuthContextData {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    loadStoredAuth()
  }, [])

  async function loadStoredAuth() {
    try {
      setIsLoading(true)
      const token = await SecureStore.getItemAsync('token')
      
      if (token) {
        // Verificar se o token é válido
        const isValid = await authService.validateToken()
        
        if (isValid) {
          const userData = await authService.getProfile()
          setUser(userData)
        } else {
          // Token inválido, limpar dados
          await clearAuthData()
        }
      }
    } catch (error) {
      console.log('Erro ao carregar dados de autenticação:', error)
      await clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  async function clearAuthData() {
    try {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('refreshToken')
      setUser(null)
    } catch (error) {
      console.log('Erro ao limpar dados de autenticação:', error)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true)
      const response = await authService.login(email, password)
      
      // Salvar tokens no secure store
      await SecureStore.setItemAsync('token', response.token)
      if (response.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', response.refreshToken)
      }
      
      setUser(response.user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  async function signUp(name: string, email: string, password: string) {
    try {
      setIsLoading(true)
      const response = await authService.register(name, email, password)
      
      // Salvar tokens no secure store
      await SecureStore.setItemAsync('token', response.token)
      if (response.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', response.refreshToken)
      }
      
      setUser(response.user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    try {
      setIsLoading(true)
      
      // Tentar fazer logout no backend
      try {
        await authService.logout()
      } catch (error) {
        console.log('Erro ao fazer logout no servidor:', error)
        // Continuar com logout local mesmo se falhar no servidor
      }
      
      // Limpar dados locais
      await clearAuthData()
      
    } catch (error) {
      console.log('Erro ao fazer logout:', error)
      // Forçar limpeza local em caso de erro
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function forgotPassword(email: string) {
    try {
      await authService.forgotPassword(email)
    } catch (error) {
      throw error
    }
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    try {
      await authService.resetPassword(email, code, newPassword)
    } catch (error) {
      throw error
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      setIsLoading(true)
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshUserData() {
    try {
      if (!isAuthenticated) return
      
      const userData = await authService.getProfile()
      setUser(userData)
    } catch (error) {
      console.log('Erro ao atualizar dados do usuário:', error)
      // Se falhar ao buscar dados, pode ser que o token expirou
      await clearAuthData()
    }
  }

  const value: AuthContextData = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}