// src/utils/currencyUtils.ts

/**
 * Converte centavos para reais
 */
export const centavosToReais = (centavos: number): number => {
  return centavos / 100;
};

/**
 * Converte reais para centavos
 */
export const reaisToCentavos = (reais: number): number => {
  return Math.round(reais * 100);
};

/**
 * Aplica máscara de moeda brasileira em tempo real
 */
export const applyCurrencyMask = (value: string): string => {
  // Remove tudo que não é dígito
  let cleanValue = value.replace(/\D/g, '');
  
  // Se não tem valor, retorna vazio
  if (!cleanValue) return '';
  
  // Converte para número e formata
  const numberValue = parseInt(cleanValue, 10) / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

/**
 * Remove máscara de moeda e retorna número
 */
export const removeCurrencyMask = (maskedValue: string): number => {
  const cleanValue = maskedValue.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

/**
 * Formata valor para input de moeda
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  // Adiciona zeros à esquerda se necessário
  const paddedValue = numericValue.padStart(3, '0');
  
  // Insere a vírgula decimal
  const integerPart = paddedValue.slice(0, -2);
  const decimalPart = paddedValue.slice(-2);
  
  // Adiciona pontos de milhares
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedInteger},${decimalPart}`;
};

/**
 * Converte input formatado para número
 */
export const parseCurrencyInput = (formattedValue: string): number => {
  const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

/**
 * Calcula porcentagem de um valor
 */
export const calculatePercentage = (value: number, percentage: number): number => {
  return (value * percentage) / 100;
};

/**
 * Calcula que porcentagem um valor representa de outro
 */
export const calculatePercentageOf = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Arredonda valor para duas casas decimais
 */
export const roundToCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Soma array de valores monetários com precisão
 */
export const sumCurrencyValues = (values: number[]): number => {
  const sum = values.reduce((total, value) => total + (value * 100), 0);
  return sum / 100;
};

/**
 * Subtrai valores monetários com precisão
 */
export const subtractCurrencyValues = (minuend: number, subtrahend: number): number => {
  return (minuend * 100 - subtrahend * 100) / 100;
};

/**
 * Multiplica valor monetário por quantidade
 */
export const multiplyCurrencyValue = (value: number, multiplier: number): number => {
  return roundToCurrency(value * multiplier);
};

/**
 * Divide valor monetário
 */
export const divideCurrencyValue = (value: number, divisor: number): number => {
  if (divisor === 0) return 0;
  return roundToCurrency(value / divisor);
};