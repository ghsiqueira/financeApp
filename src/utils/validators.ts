import { VALIDATION_RULES } from '../constants';

/**
 * Valida email
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  if (!VALIDATION_RULES.EMAIL.test(email)) {
    return { isValid: false, error: 'Email inválido' };
  }
  
  return { isValid: true };
};

/**
 * Valida senha
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Senha deve ter pelo menos ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida confirmação de senha
 */
export const validatePasswordConfirmation = (
  password: string, 
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Confirmação de senha é obrigatória' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Senhas não coincidem' };
  }
  
  return { isValid: true };
};

/**
 * Valida nome
 */
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name?.trim()) {
    return { isValid: false, error: 'Nome é obrigatório' };
  }
  
  if (name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Nome deve ter pelo menos ${VALIDATION_RULES.NAME_MIN_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida valor monetário
 */
export const validateAmount = (amount: number | string): { isValid: boolean; error?: string } => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return { isValid: false, error: 'Valor inválido' };
  }
  
  if (numericAmount < VALIDATION_RULES.AMOUNT_MIN) {
    return { 
      isValid: false, 
      error: `Valor deve ser maior que ${VALIDATION_RULES.AMOUNT_MIN}` 
    };
  }
  
  if (numericAmount > VALIDATION_RULES.AMOUNT_MAX) {
    return { 
      isValid: false, 
      error: `Valor deve ser menor que ${VALIDATION_RULES.AMOUNT_MAX}` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida CPF
 */
export const validateCPF = (cpf: string): { isValid: boolean; error?: string } => {
  if (!cpf) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  // Algoritmo de validação do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  return { isValid: true };
};

/**
 * Valida telefone
 */
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  return { isValid: true };
};

/**
 * Valida data
 */
export const validateDate = (date: string | Date): { isValid: boolean; error?: string } => {
  if (!date) {
    return { isValid: false, error: 'Data é obrigatória' };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Data inválida' };
  }
  
  return { isValid: true };
};

/**
 * Valida data não pode ser futura
 */
export const validatePastDate = (date: string | Date): { isValid: boolean; error?: string } => {
  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (dateObj > today) {
    return { isValid: false, error: 'Data não pode ser futura' };
  }
  
  return { isValid: true };
};

/**
 * Valida data não pode ser passada
 */
export const validateFutureDate = (date: string | Date): { isValid: boolean; error?: string } => {
  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) {
    return { isValid: false, error: 'Data não pode ser passada' };
  }
  
  return { isValid: true };
};

/**
 * Valida campo obrigatório
 */
export const validateRequired = (value: any, fieldName: string): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  
  if (typeof value === 'string' && !value.trim()) {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  
  return { isValid: true };
};

/**
 * Valida comprimento mínimo
 */
export const validateMinLength = (
  value: string, 
  minLength: number, 
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (!value || value.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} deve ter pelo menos ${minLength} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida comprimento máximo
 */
export const validateMaxLength = (
  value: string, 
  maxLength: number, 
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (value && value.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} deve ter no máximo ${maxLength} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida valor numérico
 */
export const validateNumeric = (value: any, fieldName: string): { isValid: boolean; error?: string } => {
  if (isNaN(Number(value))) {
    return { isValid: false, error: `${fieldName} deve ser um número válido` };
  }
  
  return { isValid: true };
};

/**
 * Valida valor positivo
 */
export const validatePositive = (value: number, fieldName: string): { isValid: boolean; error?: string } => {
  if (value <= 0) {
    return { isValid: false, error: `${fieldName} deve ser um valor positivo` };
  }
  
  return { isValid: true };
};

/**
 * Validador genérico para formulários
 */
export const validateForm = (
  data: Record<string, any>, 
  rules: Record<string, Array<(value: any) => { isValid: boolean; error?: string }>>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors[field] = result.error || 'Valor inválido';
        break; // Para no primeiro erro
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};