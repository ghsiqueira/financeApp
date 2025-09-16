/**
 * Utilitários para manipulação de datas
 */

/**
 * Retorna o primeiro dia do mês atual
 */
export const getStartOfMonth = (date?: Date): Date => {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Retorna o último dia do mês atual
 */
export const getEndOfMonth = (date?: Date): Date => {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Retorna o primeiro dia do ano atual
 */
export const getStartOfYear = (date?: Date): Date => {
  const d = date || new Date();
  return new Date(d.getFullYear(), 0, 1);
};

/**
 * Retorna o último dia do ano atual
 */
export const getEndOfYear = (date?: Date): Date => {
  const d = date || new Date();
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
};

/**
 * Adiciona dias a uma data
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adiciona meses a uma data
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Adiciona anos a uma data
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Calcula diferença em dias entre duas datas
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Verifica se duas datas são do mesmo dia
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Verifica se uma data é hoje
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Verifica se uma data é ontem
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = addDays(new Date(), -1);
  return isSameDay(date, yesterday);
};

/**
 * Verifica se uma data é esta semana
 */
export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Verifica se uma data é este mês
 */
export const isThisMonth = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Verifica se uma data é este ano
 */
export const isThisYear = (date: Date): boolean => {
  return date.getFullYear() === new Date().getFullYear();
};

/**
 * Retorna array com os últimos N meses
 */
export const getLastMonths = (count: number): Array<{ month: number; year: number; label: string }> => {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = addMonths(today, -i);
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
  }
  
  return months.reverse();
};

/**
 * Retorna array com os últimos N anos
 */
export const getLastYears = (count: number): Array<{ year: number; label: string }> => {
  const years = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < count; i++) {
    const year = currentYear - i;
    years.push({
      year,
      label: year.toString()
    });
  }
  
  return years.reverse();
};

/**
 * Converte data para string no formato ISO (YYYY-MM-DD)
 */
export const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Converte string ISO para objeto Date
 */
export const fromISODateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00.000Z');
};

/**
 * Retorna nome do mês em português
 */
export const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '';
};

/**
 * Retorna nome do dia da semana em português
 */
export const getDayName = (day: number): string => {
  const days = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  return days[day] || '';
};

/**
 * Verifica se um ano é bissexto
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Retorna o número de dias no mês
 */
export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};