
// Exportar todas as funções dos utils
export * from './formatters';
export * from './validators';
export * from './storageUtils';
export * from './dateUtils'; // Adicionar export das funções de data

// Exportar funções específicas que estavam sendo importadas
export { formatDate } from './formatters';
export { validateEmail } from './validators';
export { getStartOfMonth, getEndOfMonth } from './dateUtils'; // Exportar funções de data explicitamente

// Importar o tipo Transaction do arquivo types para usar como base
import { Transaction as TypesTransaction } from '../types';

// Usar o tipo Transaction do arquivo types, que é o padrão do projeto
export type Transaction = TypesTransaction;

/**
 * Mapeia dados da API para o formato de transação usado no app
 */
export const mapTransaction = (apiData: any): Transaction => {
  return {
    _id: apiData._id || apiData.id || '',
    id: apiData.id || apiData._id || '',
    amount: Number(apiData.amount) || 0,
    description: apiData.description || '',
    category: apiData.category || '',
    date: apiData.date || new Date().toISOString(),
    type: apiData.type || 'expense', // Remove 'transfer' para compatibilidade
    userId: apiData.userId || '',
    isRecurring: Boolean(apiData.isRecurring),
    recurringDay: apiData.recurringDay,
    budgetId: apiData.budgetId,
    createdAt: apiData.createdAt || new Date().toISOString(),
    updatedAt: apiData.updatedAt || new Date().toISOString(),
  };
};

/**
 * Mapeia array de transações da API
 */
export const mapTransactions = (apiData: any[]): Transaction[] => {
  if (!Array.isArray(apiData)) {
    return [];
  }
  
  return apiData.map(mapTransaction);
};

/**
 * Função auxiliar para converter valores de entrada monetária
 */
export const parseCurrencyInput = (value: string): number => {
  // Remove tudo exceto números e vírgula
  const cleaned = value.replace(/[^\d,]/g, '');
  // Substitui vírgula por ponto para conversão
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
};