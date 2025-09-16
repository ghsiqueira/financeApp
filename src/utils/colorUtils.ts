/**
 * Converte cor hexadecimal para RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Converte RGB para hexadecimal
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Adiciona transparência (alpha) a uma cor hexadecimal
 */
export const addAlphaToHex = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

/**
 * Escurece uma cor hexadecimal
 */
export const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);
  
  return rgbToHex(r, g, b);
};

/**
 * Clareia uma cor hexadecimal
 */
export const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  
  return rgbToHex(r, g, b);
};

/**
 * Gera cor aleatória
 */
export const generateRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Obtém cor contrastante (preto ou branco) para uma cor
 */
export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  // Calcula luminância
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Verifica se uma cor é clara
 */
export const isLightColor = (hex: string): boolean => {
  return getContrastColor(hex) === '#000000';
};

/**
 * Verifica se uma cor é escura
 */
export const isDarkColor = (hex: string): boolean => {
  return getContrastColor(hex) === '#FFFFFF';
};

/**
 * Paleta de cores para categorias
 */
export const getCategoryColors = (): string[] => [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
];

/**
 * Cores para tipos de transação
 */
export const getTransactionTypeColor = (type: 'income' | 'expense'): string => {
  return type === 'income' ? '#10B981' : '#EF4444';
};

/**
 * Cores para status de orçamento
 */
export const getBudgetStatusColor = (usage: number): string => {
  if (usage <= 50) return '#10B981'; // Verde
  if (usage <= 80) return '#F59E0B'; // Amarelo
  return '#EF4444'; // Vermelho
};

/**
 * Cores para status de meta
 */
export const getGoalStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#10B981';
    case 'active':
      return '#3B82F6';
    case 'paused':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};