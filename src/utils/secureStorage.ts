// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store'

class SecureStorageHelper {
  /**
   * Salva um valor no SecureStore com validação
   */
  static async setItem(key: string, value: string | null | undefined): Promise<void> {
    try {
      // Validar se o valor é válido
      if (!value || value === 'undefined' || value === 'null') {
        console.log(`⚠️  Tentativa de salvar valor inválido para ${key}:`, value)
        return
      }

      // Garantir que é uma string
      const stringValue = String(value)
      
      if (stringValue.length === 0) {
        console.log(`⚠️  Tentativa de salvar string vazia para ${key}`)
        return
      }

      await SecureStore.setItemAsync(key, stringValue)
      console.log(`✅ Valor salvo com sucesso para ${key}`)
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key}:`, error)
      throw error
    }
  }

  /**
   * Obtém um valor do SecureStore
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key)
      
      // Validar valor retornado
      if (!value || value === 'undefined' || value === 'null') {
        return null
      }

      return value
    } catch (error) {
      console.error(`❌ Erro ao obter ${key}:`, error)
      return null
    }
  }

  /**
   * Remove um item do SecureStore
   */
  static async removeItem(key: string): Promise<void> {
    try {
      // Verificar se o item existe antes de tentar deletar
      const exists = await SecureStore.getItemAsync(key)
      
      if (exists) {
        await SecureStore.deleteItemAsync(key)
        console.log(`✅ ${key} removido com sucesso`)
      } else {
        console.log(`⚠️  ${key} não existe, nada para remover`)
      }
    } catch (error) {
      console.error(`❌ Erro ao remover ${key}:`, error)
      // Não relançar o erro para não quebrar o fluxo
    }
  }

  /**
   * Limpa todos os dados de autenticação
   */
  static async clearAuthData(): Promise<void> {
    console.log('🧹 Limpando dados de autenticação...')
    
    const authKeys = ['token', 'refreshToken', 'user']
    
    for (const key of authKeys) {
      await this.removeItem(key)
    }
    
    console.log('✅ Dados de autenticação limpos')
  }

  /**
   * Salva dados de autenticação com validação
   */
  static async saveAuthData(token: string, refreshToken?: string, user?: any): Promise<void> {
    console.log('💾 Salvando dados de autenticação...')
    
    // Salvar token principal
    await this.setItem('token', token)
    
    // Salvar refresh token se fornecido
    if (refreshToken) {
      await this.setItem('refreshToken', refreshToken)
    }
    
    // Salvar dados do usuário se fornecidos
    if (user) {
      await this.setItem('user', JSON.stringify(user))
    }
    
    console.log('✅ Dados de autenticação salvos')
  }

  /**
   * Obtém dados de autenticação
   */
  static async getAuthData(): Promise<{
    token: string | null
    refreshToken: string | null
    user: any | null
  }> {
    const [token, refreshToken, userStr] = await Promise.all([
      this.getItem('token'),
      this.getItem('refreshToken'),
      this.getItem('user')
    ])

    let user = null
    if (userStr) {
      try {
        user = JSON.parse(userStr)
      } catch (error) {
        console.error('❌ Erro ao parsear dados do usuário:', error)
      }
    }

    return { token, refreshToken, user }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getItem('token')
    return !!token
  }
}

export default SecureStorageHelper