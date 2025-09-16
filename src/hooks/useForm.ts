import { useState, useCallback } from 'react';

interface ValidationRule<T> {
  (value: T): string | undefined;
}

interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface FormActions<T> {
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setFieldTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  resetField: (field: keyof T) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormConfig<T>): FormState<T> & FormActions<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    
    // Limpa erro quando valor é alterado
    if (errors[field]) {
      setErrorsState(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrorsState(newErrors);
  }, []);

  const setTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const rules = validationRules[field];
    if (!rules || rules.length === 0) return true;

    const value = values[field];
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setError(field, error);
        return false;
      }
    }

    // Remove erro se validação passou
    if (errors[field]) {
      setErrorsState(prev => ({ ...prev, [field]: undefined }));
    }
    
    return true;
  }, [values, validationRules, errors, setError]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isFormValid = true;

    // Valida todos os campos
    for (const field of Object.keys(validationRules) as Array<keyof T>) {
      const rules = validationRules[field];
      if (!rules || rules.length === 0) continue;

      const value = values[field];
      
      for (const rule of rules) {
        const error = rule(value);
        if (error) {
          newErrors[field] = error;
          isFormValid = false;
          break;
        }
      }
    }

    setErrorsState(newErrors);
    return isFormValid;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;

    // Marca todos os campos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouchedState(allTouched);

    // Valida formulário
    const isFormValid = validateForm();
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrorsState({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const resetField = useCallback((field: keyof T) => {
    setValuesState(prev => ({ ...prev, [field]: initialValues[field] }));
    setErrorsState(prev => ({ ...prev, [field]: undefined }));
    setTouchedState(prev => ({ ...prev, [field]: false }));
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    
    // Actions
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    resetField,
  };
}