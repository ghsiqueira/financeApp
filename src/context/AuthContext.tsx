// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import SecureStorageHelper from '../utils/secureStorage'
import { useAuthMutation } from '../hooks/useApi'
import Toast from 'react-native-toast-message'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface AuthContextData {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  refreshUserData: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { 
    login, 
    register, 
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    loading: authLoading,
    error: authError,
    reset: resetAuth
  } = useAuthMutation()

  const isAuthenticated = !!user

  // Verificar autenticação ao inicializar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Monitorar erros de autenticação
  useEffect(() => {
    if (authError) {
      Toast.show({
        type: 'error',
        text1: 'Erro de Autenticação',
        text2: authError
      })
    }
  }, [authError])

  async function checkAuthStatus() {
    try {
      setIsLoading(true)
      
      const { token, user: savedUser } = await SecureStorageHelper.getAuthData()
      
      if (token && savedUser) {
        setUser(savedUser)
        console.log('✅ Usuário autenticado:', savedUser.email)
      } else {
        console.log('⚠️  Nenhum usuário autenticado encontrado')
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status de autenticação:', error)
      await SecureStorageHelper.clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true)
      resetAuth() // Limpar erros anteriores
      
      // Limpar e validar dados de entrada
      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password.trim()
      
      // Validações básicas no frontend
      if (!cleanEmail) {
        throw new Error('Email é obrigatório')
      }
      
      if (!cleanPassword) {
        throw new Error('Senha é obrigatória')
      }
      
      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Email inválido')
      }
      
      console.log('🔑 Tentando fazer login com:', { email: cleanEmail, senha: '***' })
      const response = await login(cleanEmail, cleanPassword)
      
      console.log('📝 Resposta do login:', response)
      
      // A resposta vem na estrutura: response.data.data.{token, user, refreshToken}
      let authData
      
      if (response?.data?.data) {
        // Estrutura atual: { data: { data: { token, user, refreshToken } } }
        authData = response.data.data
      } else if (response?.data) {
        // Estrutura alternativa: { data: { token, user, refreshToken } }
        authData = response.data
      } else if (response?.token) {
        // Estrutura direta: { token, user, refreshToken }
        authData = response
      } else {
        console.error('❌ Estrutura de resposta não reconhecida:', response)
        throw new Error('Formato de resposta inválido')
      }

      const { token, refreshToken, user: userData } = authData
      
      console.log('📋 Dados extraídos:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken, 
        hasUser: !!userData,
        userName: userData?.nome || userData?.name
      })
      
      // Validar dados recebidos
      if (!token) {
        throw new Error('Token não recebido')
      }
      
      if (!userData) {
        throw new Error('Dados do usuário não recebidos')
      }

      // Salvar dados no storage
      await SecureStorageHelper.saveAuthData(token, refreshToken, userData)
      
      // Atualizar estado
      setUser(userData)
      
      console.log('✅ Login realizado com sucesso')
      Toast.show({
        type: 'success',
        text1: 'Bem-vindo!',
        text2: `Olá, ${userData.nome || userData.name}!`
      })
      
    } catch (error: any) {
      console.error('❌ Erro no signIn:', error)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          'Erro ao fazer login'
      
      Toast.show({
        type: 'error',
        text1: 'Erro no Login',
        text2: errorMessage
      })
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  async function signUp(name: string, email: string, password: string) {
    try {
      setIsLoading(true)
      resetAuth()
      
      // Limpar e validar dados de entrada
      const cleanName = name.trim()
      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password.trim()
      
      // Validações básicas no frontend
      if (!cleanName) {
        throw new Error('Nome é obrigatório')
      }
      
      if (!cleanEmail) {
        throw new Error('Email é obrigatório')
      }
      
      if (!cleanPassword) {
        throw new Error('Senha é obrigatória')
      }
      
      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Email inválido')
      }
      
      console.log('📝 Tentando registrar usuário:', { nome: cleanName, email: cleanEmail, senha: '***' })
      const response = await register(cleanName, cleanEmail, cleanPassword)
      
      console.log('📝 Resposta do registro:', response)
      
      // A resposta vem na estrutura: response.data.data.{token, user, refreshToken}
      let authData
      
      if (response?.data?.data) {
        // Estrutura atual: { data: { data: { token, user, refreshToken } } }
        authData = response.data.data
      } else if (response?.data) {
        // Estrutura alternativa: { data: { token, user, refreshToken } }
        authData = response.data
      } else if (response?.token) {
        // Estrutura direta: { token, user, refreshToken }
        authData = response
      } else {
        console.error('❌ Estrutura de resposta não reconhecida:', response)
        throw new Error('Formato de resposta inválido')
      }

      const { token, refreshToken, user: userData } = authData
      
      console.log('📋 Dados extraídos do registro:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken, 
        hasUser: !!userData,
        userName: userData?.nome || userData?.name
      })
      
      // Validar dados recebidos
      if (!token) {
        throw new Error('Token não recebido')
      }
      
      if (!userData) {
        throw new Error('Dados do usuário não recebidos')
      }

      // Salvar dados no storage
      await SecureStorageHelper.saveAuthData(token, refreshToken, userData)
      
      // Atualizar estado
      setUser(userData)
      
      console.log('✅ Registro realizado com sucesso')
      Toast.show({
        type: 'success',
        text1: 'Conta Criada!',
        text2: `Bem-vindo, ${userData.nome || userData.name}!`
      })
      
    } catch (error: any) {
      console.error('❌ Erro no signUp:', error)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          'Erro ao criar conta'
      
      Toast.show({
        type: 'error',
        text1: 'Erro no Registro',
        text2: errorMessage
      })
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    try {
      setIsLoading(true)
      
      // Limpar dados do storage
      await SecureStorageHelper.clearAuthData()
      
      // Limpar estado
      setUser(null)
      
      console.log('✅ Logout realizado')
      Toast.show({
        type: 'success',
        text1: 'Logout Realizado',
        text2: 'Volte sempre!'
      })
      
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      // Forçar limpeza mesmo em caso de erro
      await SecureStorageHelper.clearAuthData()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function forgotPassword(email: string) {
    try {
      resetAuth()
      
      console.log('📧 Solicitando reset de senha para:', email)
      const response = await forgotPasswordMutation(email)
      
      console.log('✅ Resposta forgot password:', response)
      
      if (response?.success !== false) {
        Toast.show({
          type: 'success',
          text1: 'Email Enviado',
          text2: 'Verifique sua caixa de entrada'
        })
      }
      
    } catch (error: any) {
      console.error('❌ Erro no forgotPassword:', error)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          'Erro ao enviar email'
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage
      })
      
      throw new Error(errorMessage)
    }
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    try {
      resetAuth()
      
      console.log('🔐 Redefinindo senha para:', { email, code: '***', newPassword: '***' })
      const response = await resetPasswordMutation(email, code, newPassword)
      
      console.log('✅ Resposta reset password:', response)
      
      if (response?.success !== false) {
        Toast.show({
          type: 'success',
          text1: 'Senha Alterada',
          text2: 'Sua senha foi atualizada com sucesso'
        })
      }
      
    } catch (error: any) {
      console.error('❌ Erro no resetPassword:', error)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          'Erro ao alterar senha'
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage
      })
      
      throw new Error(errorMessage)
    }
  }

  async function refreshUserData() {
    try {
      if (!isAuthenticated) return
      
      // Aqui você pode fazer uma requisição para atualizar os dados do usuário
      // const userData = await api.get('/user/profile')
      // setUser(userData)
      
      console.log('🔄 Dados do usuário atualizados')
      
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error)
      // Em caso de erro, pode ser que o token expirou
      await signOut()
    }
  }

  const value: AuthContextData = {
    user,
    isLoading: isLoading || authLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
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