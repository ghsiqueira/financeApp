// src/components/common/AdditionalComponents.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ViewStyle,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

// Interface para ProgressBar
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  showText?: boolean;
}

// Componente ProgressBar
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = COLORS.primary,
  backgroundColor = COLORS.gray200,
  height = 8,
  style,
  showText = false,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View style={style}>
      <View style={[
        styles.progressBarContainer,
        { backgroundColor, height, borderRadius: height / 2 }
      ]}>
        <View style={[
          styles.progressBarFill,
          {
            backgroundColor: color,
            width: `${clampedProgress}%`,
            height,
            borderRadius: height / 2,
          }
        ]} />
      </View>
      {showText && (
        <Text style={styles.progressBarText}>
          {clampedProgress.toFixed(0)}%
        </Text>
      )}
    </View>
  );
};

// Interface para FloatingActionButton
interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
  size?: number;
  disabled?: boolean;
}

// Componente FloatingActionButton
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  style,
  color = COLORS.white,
  backgroundColor = COLORS.primary,
  size = 56,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: disabled ? COLORS.gray400 : backgroundColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={icon as any} 
        size={size * 0.4} 
        color={disabled ? COLORS.gray600 : color} 
      />
    </TouchableOpacity>
  );
};

// Interface para Select
interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Componente Select
export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Selecione uma opção",
  value,
  onValueChange,
  options,
  error,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.selectContainer}>
      {label && (
        <Text style={styles.selectLabel}>
          {label}
          {required && <Text style={styles.selectRequired}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectButtonText,
          !selectedOption && styles.selectPlaceholder,
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={error ? COLORS.error : COLORS.gray400} 
        />
      </TouchableOpacity>

      {error && <Text style={styles.selectError}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.selectModalOverlay}
          onPress={() => setIsOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.selectModal}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>
                {label || 'Selecione uma opção'}
              </Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={styles.selectModalClose}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.selectOptionsList} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    option.value === value && styles.selectOptionSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    option.value === value && styles.selectOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Interface para DatePicker
interface DatePickerProps {
  label?: string;
  value: Date;
  onDateChange: (date: Date) => void;
  error?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  helperText?: string;
}

// Constantes para o calendário em português
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Componente DatePicker REFATORADO (sem duplicação)
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onDateChange,
  error,
  required = false,
  minimumDate,
  maximumDate,
  helperText,
}) => {
  const [isQuickSelectVisible, setIsQuickSelectVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  const quickSelectOptions = [
    { label: '3 meses', months: 3 },
    { label: '6 meses', months: 6 },
    { label: '1 ano', months: 12 },
    { label: '2 anos', months: 24 },
  ];

  const handleQuickSelect = (months: number) => {
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + months);
    onDateChange(newDate);
    setIsQuickSelectVisible(false);
  };

  const openCustomCalendar = () => {
    setIsQuickSelectVisible(false);
    setCurrentMonth(value.getMonth());
    setCurrentYear(value.getFullYear());
    setIsCalendarVisible(true);
  };

  // Gerar dias do mês para o calendário
  const generateCalendarDays = () => {
    const today = new Date();
    const minDate = minimumDate || new Date(1900, 0, 1);
    const maxDate = maximumDate || new Date(2100, 11, 31);
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const day = new Date(currentDate);
      const isCurrentMonth = day.getMonth() === currentMonth;
      const isToday = day.toDateString() === today.toDateString();
      const isSelected = day.toDateString() === value.toDateString();
      const isDisabled = day < minDate || day > maxDate;

      days.push({
        date: day,
        day: day.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDatePress = (date: Date) => {
    const minDate = minimumDate || new Date(1900, 0, 1);
    const maxDate = maximumDate || new Date(2100, 11, 31);
    
    if (date >= minDate && date <= maxDate) {
      onDateChange(date);
      setIsCalendarVisible(false);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <View style={styles.datePickerContainer}>
      {label && (
        <Text style={styles.datePickerLabel}>
          {label}
          {required && <Text style={styles.datePickerRequired}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.datePickerButton,
          error && styles.datePickerButtonError,
        ]}
        onPress={() => setIsQuickSelectVisible(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={COLORS.gray400} />
        <Text style={styles.datePickerButtonText}>
          {formatDate(value)}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.gray400} />
      </TouchableOpacity>

      {helperText && (
        <Text style={styles.datePickerHelper}>{helperText}</Text>
      )}
      
      {error && <Text style={styles.datePickerError}>{error}</Text>}

      {/* Modal de Seleção Rápida */}
      <Modal
        visible={isQuickSelectVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsQuickSelectVisible(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModal}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>
                {label || 'Selecionar Data'}
              </Text>
              <TouchableOpacity 
                onPress={() => setIsQuickSelectVisible(false)}
                style={styles.dateModalClose}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateModalContent}>
              <Text style={styles.quickSelectTitle}>Opções rápidas:</Text>
              <View style={styles.quickSelectButtons}>
                {quickSelectOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.quickSelectButton}
                    onPress={() => handleQuickSelect(option.months)}
                  >
                    <Text style={styles.quickSelectButtonText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.customDateButton}
                onPress={openCustomCalendar}
              >
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.customDateButtonText}>Escolher data personalizada</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateModalButtons}>
              <TouchableOpacity
                style={styles.dateModalButtonCancel}
                onPress={() => setIsQuickSelectVisible(false)}
              >
                <Text style={styles.dateModalButtonTextCancel}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal do Calendário Personalizado */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModal}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{label || 'Selecionar Data'}</Text>
              <TouchableOpacity onPress={() => setIsCalendarVisible(false)} style={styles.calendarCloseButton}>
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            {/* Navigation */}
            <View style={styles.calendarNavigation}>
              <TouchableOpacity
                onPress={() => navigateMonth('prev')}
                style={styles.calendarNavButton}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              <Text style={styles.calendarMonthYear}>
                {MONTHS[currentMonth]} {currentYear}
              </Text>

              <TouchableOpacity
                onPress={() => navigateMonth('next')}
                style={styles.calendarNavButton}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.calendarWeekdaysContainer}>
              {WEEKDAYS.map((weekday) => (
                <Text key={weekday} style={styles.calendarWeekdayText}>
                  {weekday}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <ScrollView style={styles.calendarGrid}>
              <View style={styles.calendarRows}>
                {Array.from({ length: 6 }, (_, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarRow}>
                    {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dayData, dayIndex) => (
                      <TouchableOpacity
                        key={`${weekIndex}-${dayIndex}`}
                        style={[
                          styles.calendarDayButton,
                          !dayData.isCurrentMonth && styles.calendarDayButtonOtherMonth,
                          dayData.isToday && styles.calendarDayButtonToday,
                          dayData.isSelected && styles.calendarDayButtonSelected,
                          dayData.isDisabled && styles.calendarDayButtonDisabled,
                        ]}
                        onPress={() => handleDatePress(dayData.date)}
                        disabled={dayData.isDisabled}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            !dayData.isCurrentMonth && styles.calendarDayTextOtherMonth,
                            dayData.isToday && styles.calendarDayTextToday,
                            dayData.isSelected && styles.calendarDayTextSelected,
                            dayData.isDisabled && styles.calendarDayTextDisabled,
                          ]}
                        >
                          {dayData.day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={styles.calendarCancelButton}
                onPress={() => setIsCalendarVisible(false)}
              >
                <Text style={styles.calendarCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Interface para CurrencyInput
interface CurrencyInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  required?: boolean;
  helperText?: string;
  autoFocus?: boolean;
}

// Componente CurrencyInput
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  placeholder = "0,00",
  value,
  onChangeText,
  error,
  required = false,
  helperText,
  autoFocus = false,
}) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const formatCurrencyRealTime = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    if (numbers.length === 1) {
      return numbers;
    } else if (numbers.length === 2) {
      return numbers;
    } else if (numbers.length === 3) {
      return `${numbers.slice(0, 1)},${numbers.slice(1)}`;
    } else {
      const integerPart = numbers.slice(0, -2);
      const decimalPart = numbers.slice(-2);
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedInteger},${decimalPart}`;
    }
  };

  const formatCurrencyFinal = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    const cents = parseInt(numbers) || 0;
    const reais = cents / 100;
    
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleInputChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const formatted = formatCurrencyRealTime(numbers);
    setInputValue(formatted);
  };

  const handleModalSubmit = () => {
    const numbers = inputValue.replace(/\D/g, '');
    const formatted = formatCurrencyFinal(numbers);
    onChangeText(formatted);
    setIsModalVisible(false);
    setInputValue('');
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setInputValue('');
  };

  const openModal = () => {
    if (value) {
      const numbers = value.replace(/\D/g, '');
      const formatted = formatCurrencyRealTime(numbers);
      setInputValue(formatted);
    } else {
      setInputValue('');
    }
    setIsModalVisible(true);
  };

  return (
    <View style={styles.currencyInputContainer}>
      {label && (
        <Text style={styles.currencyInputLabel}>
          {label}
          {required && <Text style={styles.currencyInputRequired}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.currencyInputWrapper,
          error && styles.currencyInputWrapperError,
        ]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="cash-outline" 
          size={20} 
          color={error ? COLORS.error : COLORS.gray400}
          style={styles.currencyInputIcon}
        />
        <Text style={styles.currencyInputSymbol}>R$</Text>
        <Text 
          style={[
            styles.currencyInput,
            !value && styles.currencyInputPlaceholder,
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={COLORS.gray400} 
        />
      </TouchableOpacity>

      {helperText && (
        <Text style={styles.currencyInputHelper}>{helperText}</Text>
      )}
      
      {error && <Text style={styles.currencyInputError}>{error}</Text>}

      {/* Modal para input de valor */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleModalCancel}
      >
        <View style={styles.currencyModalOverlay}>
          <View style={styles.currencyModal}>
            <View style={styles.currencyModalHeader}>
              <Text style={styles.currencyModalTitle}>
                {label || 'Digite o valor'}
              </Text>
              <TouchableOpacity 
                onPress={handleModalCancel}
                style={styles.currencyModalClose}
              >
                <Ionicons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.currencyModalContent}>
              <View style={styles.currencyModalInputWrapper}>
                <Text style={styles.currencyModalSymbol}>R$</Text>
                <TextInput
                  style={styles.currencyModalInput}
                  value={inputValue}
                  onChangeText={handleInputChange}
                  placeholder="1500"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
              
              <Text style={styles.currencyModalPreview}>
                Valor: {inputValue || '0,00'}
              </Text>
            </View>

            <View style={styles.currencyModalButtons}>
              <TouchableOpacity
                style={[styles.currencyModalButton, styles.currencyModalButtonCancel]}
                onPress={handleModalCancel}
              >
                <Text style={styles.currencyModalButtonTextCancel}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.currencyModalButton, styles.currencyModalButtonConfirm]}
                onPress={handleModalSubmit}
              >
                <Text style={styles.currencyModalButtonTextConfirm}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Interface para CustomAlert
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

// Componente CustomAlert
export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  loading = false,
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Ionicons 
              name={getIcon() as any} 
              size={32} 
              color={getIconColor()} 
            />
            <Text style={styles.alertTitle}>{title}</Text>
          </View>

          {message && (
            <Text style={styles.alertMessage}>{message}</Text>
          )}

          {children}

          <View style={styles.alertButtons}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonCancel]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.alertButtonTextCancel}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.alertButton, 
                styles.alertButtonConfirm,
                onCancel && styles.alertButtonConfirmWithCancel,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.alertButtonTextConfirm}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Estilos
const styles = StyleSheet.create({
  // ProgressBar
  progressBarContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressBarText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // FloatingActionButton
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },

  // Select
  selectContainer: {
    marginBottom: SPACING.md,
  },
  selectLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  selectRequired: {
    color: COLORS.error,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  selectButtonError: {
    borderColor: COLORS.error,
  },
  selectButtonDisabled: {
    backgroundColor: COLORS.gray100,
    opacity: 0.6,
  },
  selectButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  selectPlaceholder: {
    color: COLORS.gray400,
  },
  selectError: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    maxHeight: '70%', // Máximo 70% da altura da tela
    minWidth: '80%',
    ...SHADOWS.lg,
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  selectModalClose: {
    padding: SPACING.xs,
  },
  selectOptionsList: {
    maxHeight: 250, // Altura máxima para o scroll
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  selectOptionSelected: {
    backgroundColor: COLORS.primary10,
  },
  selectOptionText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  selectOptionTextSelected: {
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  // DatePicker
  datePickerContainer: {
    marginBottom: SPACING.md,
  },
  datePickerLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  datePickerRequired: {
    color: COLORS.error,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  datePickerButtonError: {
    borderColor: COLORS.error,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  datePickerHelper: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  datePickerError: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },

  // Date Modal (Opções rápidas)
  dateModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  dateModalClose: {
    padding: SPACING.xs,
  },
  dateModalContent: {
    padding: SPACING.lg,
  },
  quickSelectTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickSelectButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary10,
    borderRadius: BORDER_RADIUS.md,
  },
  quickSelectButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  customDateButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  dateModalButtons: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  dateModalButtonCancel: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  dateModalButtonTextCancel: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  // Calendar Modal (Calendário personalizado)
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  calendarTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  calendarCloseButton: {
    padding: SPACING.xs,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  calendarNavButton: {
    padding: SPACING.xs,
  },
  calendarMonthYear: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  calendarWeekdaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  calendarWeekdayText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  calendarGrid: {
    maxHeight: 250,
  },
  calendarRows: {
    paddingHorizontal: SPACING.lg,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  calendarDayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  calendarDayButtonOtherMonth: {
    opacity: 0.3,
  },
  calendarDayButtonToday: {
    backgroundColor: COLORS.primary10,
  },
  calendarDayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarDayButtonDisabled: {
    opacity: 0.2,
  },
  calendarDayText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  calendarDayTextOtherMonth: {
    color: COLORS.textSecondary,
  },
  calendarDayTextToday: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  calendarDayTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  calendarDayTextDisabled: {
    color: COLORS.gray400,
  },
  calendarFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calendarCancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  calendarCancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  // CurrencyInput
  currencyInputContainer: {
    marginBottom: SPACING.md,
  },
  currencyInputLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  currencyInputRequired: {
    color: COLORS.error,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  currencyInputWrapperError: {
    borderColor: COLORS.error,
  },
  currencyInputIcon: {
    marginRight: SPACING.xs,
  },
  currencyInputSymbol: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  currencyInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  currencyInputPlaceholder: {
    color: COLORS.gray400,
  },
  currencyInputHelper: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  currencyInputError: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },

  // Currency Modal
  currencyModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  currencyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  currencyModalClose: {
    padding: SPACING.xs,
  },
  currencyModalContent: {
    padding: SPACING.lg,
  },
  currencyModalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  currencyModalSymbol: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  currencyModalInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'left',
    padding: 0,
  },
  currencyModalPreview: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.primary10,
    borderRadius: BORDER_RADIUS.md,
  },
  currencyModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    paddingTop: 0,
  },
  currencyModalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  currencyModalButtonCancel: {
    backgroundColor: COLORS.gray100,
  },
  currencyModalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  currencyModalButtonTextCancel: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  currencyModalButtonTextConfirm: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },

  // CustomAlert
  alertOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minWidth: '80%',
    maxWidth: '90%',
    ...SHADOWS.lg,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  alertTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  alertMessage: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  alertButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  alertButtonCancel: {
    backgroundColor: COLORS.gray100,
  },
  alertButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  alertButtonConfirmWithCancel: {
    flex: 2,
  },
  alertButtonTextCancel: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  alertButtonTextConfirm: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
});