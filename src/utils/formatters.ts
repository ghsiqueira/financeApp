// src/utils/formatters.ts

/**
 * Formatar valor monetário para o padrão brasileiro
 */
export const formatCurrency = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formatar data para o padrão brasileiro
 */
export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'Data inválida';
  }
};

/**
 * Formatar data e hora para o padrão brasileiro
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Data inválida';
  }
};

/**
 * Formatar número com separador de milhares
 */
export const formatNumber = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  return value.toLocaleString('pt-BR');
};

/**
 * Formatar porcentagem
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatar valor monetário compacto (K, M, B)
 */
export const formatCurrencyCompact = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0';
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1000000000) {
    return `${sign}R$ ${(abs / 1000000000).toFixed(1)}B`;
  } else if (abs >= 1000000) {
    return `${sign}R$ ${(abs / 1000000).toFixed(1)}M`;
  } else if (abs >= 1000) {
    return `${sign}R$ ${(abs / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(value);
  }
};

/**
 * Formatar texto de entrada de moeda (remove formatação)
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo exceto números, vírgula e pontos
  const numbersOnly = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto (padrão brasileiro -> padrão americano)
  const normalizedValue = numbersOnly.replace(',', '.');
  
  const parsed = parseFloat(normalizedValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formatar data relativa (há X dias, ontem, hoje)
 */
export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `Há ${diffDays} dias`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Há 1 semana' : `Há ${weeks} semanas`;
    } else if (diffDays <= 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 'Há 1 mês' : `Há ${months} meses`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? 'Há 1 ano' : `Há ${years} anos`;
    }
  } catch (error) {
    return formatDate(date);
  }
};

/**
 * Formatar duração em dias para texto legível
 */
export const formatDuration = (days: number): string => {
  if (days < 0) {
    return 'Vencido';
  } else if (days === 0) {
    return 'Hoje';
  } else if (days === 1) {
    return '1 dia';
  } else if (days <= 7) {
    return `${days} dias`;
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return weeks === 1 ? '1 semana' : `${weeks} semanas`;
    } else {
      return weeks === 1 
        ? `1 semana e ${remainingDays} dia${remainingDays > 1 ? 's' : ''}`
        : `${weeks} semanas e ${remainingDays} dia${remainingDays > 1 ? 's' : ''}`;
    }
  } else if (days <= 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return months === 1 ? '1 mês' : `${months} meses`;
    } else {
      return months === 1 
        ? `1 mês e ${remainingDays} dias`
        : `${months} meses e ${remainingDays} dias`;
    }
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) {
      return years === 1 ? '1 ano' : `${years} anos`;
    } else {
      const months = Math.floor(remainingDays / 30);
      return years === 1 
        ? `1 ano e ${months} meses`
        : `${years} anos e ${months} meses`;
    }
  }
};