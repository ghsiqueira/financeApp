import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Salva dados no AsyncStorage com tratamento de erro
 */
export const saveToStorage = async (key: string, value: any): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no storage:`, error);
    return false;
  }
};

/**
 * Recupera dados do AsyncStorage com tratamento de erro
 */
export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Erro ao recuperar ${key} do storage:`, error);
    return null;
  }
};

/**
 * Remove item do AsyncStorage
 */
export const removeFromStorage = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover ${key} do storage:`, error);
    return false;
  }
};

/**
 * Remove múltiplos itens do AsyncStorage
 */
export const removeMultipleFromStorage = async (keys: string[]): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Erro ao remover múltiplos itens do storage:', error);
    return false;
  }
};

/**
 * Verifica se uma chave existe no AsyncStorage
 */
export const existsInStorage = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    console.error(`Erro ao verificar existência de ${key} no storage:`, error);
    return false;
  }
};

/**
 * Obtém todas as chaves do AsyncStorage
 */
export const getAllStorageKeys = async (): Promise<string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Erro ao obter todas as chaves do storage:', error);
    return [];
  }
};

/**
 * Limpa todo o AsyncStorage
 */
export const clearAllStorage = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Erro ao limpar todo o storage:', error);
    return false;
  }
};

/**
 * Salva configurações do usuário
 */
export const saveUserSettings = async (settings: any): Promise<boolean> => {
  return await saveToStorage('@user_settings', settings);
};

/**
 * Recupera configurações do usuário
 */
export const getUserSettings = async (): Promise<any | null> => {
  return await getFromStorage('@user_settings');
};

/**
 * Salva dados de cache com timestamp
 */
export const saveCacheData = async (key: string, data: any, expirationHours: number = 24): Promise<boolean> => {
  const cacheData = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000)
  };
  
  return await saveToStorage(`@cache_${key}`, cacheData);
};

/**
 * Recupera dados de cache verificando se não expirou
 */
export const getCacheData = async <T>(key: string): Promise<T | null> => {
  const cacheData = await getFromStorage<{
    data: T;
    timestamp: number;
    expiresAt: number;
  }>(`@cache_${key}`);
  
  if (!cacheData) return null;
  
  // Verifica se o cache expirou
  if (Date.now() > cacheData.expiresAt) {
    await removeFromStorage(`@cache_${key}`);
    return null;
  }
  
  return cacheData.data;
};

/**
 * Remove cache expirado
 */
export const cleanExpiredCache = async (): Promise<void> => {
  try {
    const allKeys = await getAllStorageKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith('@cache_'));
    
    for (const key of cacheKeys) {
      const cacheData = await getFromStorage<{
        expiresAt: number;
      }>(key);
      
      if (cacheData && Date.now() > cacheData.expiresAt) {
        await removeFromStorage(key);
      }
    }
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
  }
};

/**
 * Obtém tamanho estimado do storage em bytes
 */
export const getStorageSize = async (): Promise<number> => {
  try {
    const allKeys = await getAllStorageKeys();
    let totalSize = 0;
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Erro ao calcular tamanho do storage:', error);
    return 0;
  }
};
