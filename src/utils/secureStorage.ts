// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Serviço de armazenamento seguro
 *
 * Usa expo-secure-store para dados sensíveis (tokens, senhas)
 * e AsyncStorage para dados não sensíveis (preferências, cache)
 */

export enum StorageType {
  SECURE = 'secure',    // Dados criptografados (tokens, senhas)
  REGULAR = 'regular',  // Dados não sensíveis (preferências)
}

class SecureStorageService {
  /**
   * Salva um item no storage
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param type Tipo de storage (secure ou regular)
   */
  async setItem(
    key: string,
    value: string,
    type: StorageType = StorageType.SECURE
  ): Promise<void> {
    try {
      if (type === StorageType.SECURE) {
        await SecureStore.setItemAsync(key, value);
        console.log(`🔒 Salvo de forma segura: ${key}`);
      } else {
        await AsyncStorage.setItem(key, value);
        console.log(`💾 Salvo no AsyncStorage: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key}:`, error);
      throw error;
    }
  }

  /**
   * Recupera um item do storage
   * @param key Chave do item
   * @param type Tipo de storage (secure ou regular)
   * @returns Valor armazenado ou null
   */
  async getItem(
    key: string,
    type: StorageType = StorageType.SECURE
  ): Promise<string | null> {
    try {
      let value: string | null = null;

      if (type === StorageType.SECURE) {
        value = await SecureStore.getItemAsync(key);
        console.log(`🔓 Recuperado de forma segura: ${key}`);
      } else {
        value = await AsyncStorage.getItem(key);
        console.log(`📂 Recuperado do AsyncStorage: ${key}`);
      }

      return value;
    } catch (error) {
      console.error(`❌ Erro ao recuperar ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove um item do storage
   * @param key Chave do item
   * @param type Tipo de storage (secure ou regular)
   */
  async removeItem(
    key: string,
    type: StorageType = StorageType.SECURE
  ): Promise<void> {
    try {
      if (type === StorageType.SECURE) {
        await SecureStore.deleteItemAsync(key);
        console.log(`🗑️ Removido do SecureStore: ${key}`);
      } else {
        await AsyncStorage.removeItem(key);
        console.log(`🗑️ Removido do AsyncStorage: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao remover ${key}:`, error);
      throw error;
    }
  }

  /**
   * Salva um objeto como JSON
   * @param key Chave do item
   * @param value Objeto a ser armazenado
   * @param type Tipo de storage
   */
  async setObject(
    key: string,
    value: any,
    type: StorageType = StorageType.SECURE
  ): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.setItem(key, jsonValue, type);
  }

  /**
   * Recupera um objeto do JSON
   * @param key Chave do item
   * @param type Tipo de storage
   * @returns Objeto parseado ou null
   */
  async getObject<T = any>(
    key: string,
    type: StorageType = StorageType.SECURE
  ): Promise<T | null> {
    const jsonValue = await this.getItem(key, type);

    if (!jsonValue) {
      return null;
    }

    try {
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`❌ Erro ao parsear JSON de ${key}:`, error);
      return null;
    }
  }

  /**
   * Limpa todos os itens do storage
   * @param type Tipo de storage a limpar
   */
  async clear(type: StorageType = StorageType.SECURE): Promise<void> {
    try {
      if (type === StorageType.SECURE) {
        // SecureStore não tem clear global, então não fazemos nada
        console.log('⚠️ SecureStore não suporta clear global. Use removeItem para chaves específicas.');
      } else {
        await AsyncStorage.clear();
        console.log('🧹 AsyncStorage limpo');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
      throw error;
    }
  }

  /**
   * Migra dados do AsyncStorage para SecureStore
   * @param key Chave do item a migrar
   */
  async migrateToSecure(key: string): Promise<void> {
    try {
      // Buscar do AsyncStorage
      const value = await AsyncStorage.getItem(key);

      if (value) {
        // Salvar no SecureStore
        await SecureStore.setItemAsync(key, value);
        // Remover do AsyncStorage
        await AsyncStorage.removeItem(key);
        console.log(`✅ Migrado para SecureStore: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao migrar ${key}:`, error);
      throw error;
    }
  }
}

// Exportar instância única (Singleton)
export default new SecureStorageService();
