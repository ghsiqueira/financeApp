// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Serviço de armazenamento seguro
 *
 * Usa expo-secure-store para dados sensíveis (tokens, senhas)
 * e AsyncStorage para dados não sensíveis (preferências, cache)
 *
 * IMPORTANTE: SecureStore só aceita chaves com caracteres alfanuméricos, ".", "-" e "_"
 */

export enum StorageType {
  SECURE = 'secure',    // Dados criptografados (tokens, senhas)
  REGULAR = 'regular',  // Dados não sensíveis (preferências)
}

/**
 * Valida se a chave é compatível com SecureStore
 */
function isValidSecureStoreKey(key: string): boolean {
  // SecureStore aceita apenas: a-z, A-Z, 0-9, ".", "-", "_"
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(key) && key.length > 0;
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
        // Validar chave antes de salvar no SecureStore
        if (!isValidSecureStoreKey(key)) {
          throw new Error(
            `Chave inválida para SecureStore: "${key}". Use apenas caracteres alfanuméricos, ".", "-" e "_"`
          );
        }
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
        // Validar chave antes de buscar no SecureStore
        if (!isValidSecureStoreKey(key)) {
          console.warn(
            `⚠️ Chave inválida para SecureStore: "${key}". Tentando AsyncStorage como fallback...`
          );
          value = await AsyncStorage.getItem(key);
          return value;
        }
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
   * @param oldKey Chave antiga (ex: @FinanceApp:token)
   * @param newKey Nova chave (ex: FinanceApp_token)
   */
  async migrateToSecure(oldKey: string, newKey: string): Promise<void> {
    try {
      // Validar nova chave
      if (!isValidSecureStoreKey(newKey)) {
        throw new Error(
          `Nova chave inválida para SecureStore: "${newKey}". Use apenas caracteres alfanuméricos, ".", "-" e "_"`
        );
      }

      // Buscar do AsyncStorage (chave antiga)
      const value = await AsyncStorage.getItem(oldKey);

      if (value) {
        // Salvar no SecureStore (chave nova)
        await SecureStore.setItemAsync(newKey, value);
        // Remover do AsyncStorage (chave antiga)
        await AsyncStorage.removeItem(oldKey);
        console.log(`✅ Migrado de "${oldKey}" para SecureStore "${newKey}"`);
      } else {
        console.log(`ℹ️ Nenhum dado para migrar em "${oldKey}"`);
      }
    } catch (error) {
      console.error(`❌ Erro ao migrar ${oldKey} -> ${newKey}:`, error);
      throw error;
    }
  }

  /**
   * Migra dados entre chaves no AsyncStorage
   * @param oldKey Chave antiga
   * @param newKey Nova chave
   */
  async migrateAsyncStorageKey(oldKey: string, newKey: string): Promise<void> {
    try {
      // Buscar da chave antiga
      const value = await AsyncStorage.getItem(oldKey);

      if (value) {
        // Salvar na chave nova
        await AsyncStorage.setItem(newKey, value);
        // Remover da chave antiga
        await AsyncStorage.removeItem(oldKey);
        console.log(`✅ Migrado AsyncStorage de "${oldKey}" para "${newKey}"`);
      } else {
        console.log(`ℹ️ Nenhum dado para migrar em "${oldKey}"`);
      }
    } catch (error) {
      console.error(`❌ Erro ao migrar ${oldKey} -> ${newKey}:`, error);
      throw error;
    }
  }

  /**
   * Executa migração automática de chaves antigas para novas
   * Deve ser chamado ao iniciar o app
   */
  async runMigrations(): Promise<void> {
    console.log('🔄 Executando migrações de storage...');

    try {
      // Migrar token (AsyncStorage -> SecureStore)
      await this.migrateToSecure('@FinanceApp:token', 'FinanceApp_token');

      // Migrar user (AsyncStorage antiga -> AsyncStorage nova chave)
      await this.migrateAsyncStorageKey('@FinanceApp:user', 'FinanceApp_user');

      // Migrar outras chaves se necessário
      await this.migrateAsyncStorageKey('@FinanceApp:theme', 'FinanceApp_theme');

      console.log('✅ Migrações concluídas com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante migrações:', error);
      // Não lançar erro para não bloquear o app
    }
  }
}

// Exportar instância única (Singleton)
const secureStorageService = new SecureStorageService();

// Executar migrações na primeira importação
secureStorageService.runMigrations().catch((error) => {
  console.error('❌ Falha nas migrações:', error);
});

export default secureStorageService;
