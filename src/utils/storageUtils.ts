// src/utils/storageUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

/**
 * Utilitários para gerenciar dados no AsyncStorage
 */

// Tipos
export interface StorageItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
}

/**
 * Salvar item no AsyncStorage
 */
export const setStorageItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    const item: StorageItem<T> = {
      key,
      value,
      timestamp: Date.now(),
    };
    
    const jsonValue = JSON.stringify(item);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Erro ao salvar item ${key}:`, error);
    throw error;
  }
};

/**
 * Recuperar item do AsyncStorage
 */
export const getStorageItem = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    
    if (jsonValue === null) {
      return null;
    }
    
    const item: StorageItem<T> = JSON.parse(jsonValue);
    return item.value;
  } catch (error) {
    console.error(`Erro ao recuperar item ${key}:`, error);
    return null;
  }
};

/**
 * Remover item do AsyncStorage
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover item ${key}:`, error);
    throw error;
  }
};

/**
 * Verificar se item existe no AsyncStorage
 */
export const hasStorageItem = async (key: string): Promise<boolean> => {
  try {
    const item = await AsyncStorage.getItem(key);
    return item !== null;
  } catch (error) {
    console.error(`Erro ao verificar item ${key}:`, error);
    return false;
  }
};

/**
 * Limpar todos os dados do AsyncStorage (usar com cuidado)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    // Convertemos readonly string[] para string[] usando spread operator
    const keys: string[] = [...Object.values(STORAGE_KEYS)];
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
    throw error;
  }
};

/**
 * Obter múltiplos itens do AsyncStorage
 */
export const getMultipleStorageItems = async <T>(keys: string[]): Promise<Array<T | null>> => {
  try {
    const items = await AsyncStorage.multiGet(keys);
    
    return items.map(([key, value]) => {
      if (value === null) {
        return null;
      }
      
      try {
        const item: StorageItem<T> = JSON.parse(value);
        return item.value;
      } catch (error) {
        console.error(`Erro ao parsear item ${key}:`, error);
        return null;
      }
    });
  } catch (error) {
    console.error('Erro ao recuperar múltiplos itens:', error);
    throw error;
  }
};

/**
 * Salvar múltiplos itens no AsyncStorage
 */
export const setMultipleStorageItems = async <T>(items: Array<{ key: string; value: T }>): Promise<void> => {
  try {
    const keyValuePairs: [string, string][] = items.map(({ key, value }) => {
      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
      };
      
      return [key, JSON.stringify(item)];
    });
    
    await AsyncStorage.multiSet(keyValuePairs);
  } catch (error) {
    console.error('Erro ao salvar múltiplos itens:', error);
    throw error;
  }
};

/**
 * Obter o tamanho dos dados armazenados (em bytes aproximadamente)
 */
export const getStorageSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    let totalSize = 0;
    items.forEach(([key, value]) => {
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    return totalSize;
  } catch (error) {
    console.error('Erro ao calcular tamanho do storage:', error);
    return 0;
  }
};

/**
 * Exportar dados do AsyncStorage (para backup)
 */
export const exportStorageData = async (): Promise<Record<string, any>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    const exportData: Record<string, any> = {};
    
    items.forEach(([key, value]) => {
      if (value) {
        try {
          const item: StorageItem = JSON.parse(value);
          exportData[key] = item;
        } catch (error) {
          console.warn(`Erro ao parsear item ${key} durante export:`, error);
        }
      }
    });
    
    return exportData;
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    throw error;
  }
};

/**
 * Importar dados para o AsyncStorage (para restore)
 */
export const importStorageData = async (data: Record<string, StorageItem>): Promise<void> => {
  try {
    const keyValuePairs: [string, string][] = Object.entries(data).map(([key, item]) => {
      return [key, JSON.stringify(item)];
    });
    
    await AsyncStorage.multiSet(keyValuePairs);
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    throw error;
  }
};

/**
 * Funções específicas para dados de autenticação
 */
export const AuthStorage = {
  async saveToken(token: string): Promise<void> {
    await setStorageItem(STORAGE_KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await getStorageItem<string>(STORAGE_KEYS.TOKEN);
  },

  async removeToken(): Promise<void> {
    await removeStorageItem(STORAGE_KEYS.TOKEN);
  },

  async saveUser(user: any): Promise<void> {
    await setStorageItem(STORAGE_KEYS.USER, user);
  },

  async getUser(): Promise<any | null> {
    return await getStorageItem(STORAGE_KEYS.USER);
  },

  async removeUser(): Promise<void> {
    await removeStorageItem(STORAGE_KEYS.USER);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      removeStorageItem(STORAGE_KEYS.TOKEN),
      removeStorageItem(STORAGE_KEYS.USER),
    ]);
  },
};