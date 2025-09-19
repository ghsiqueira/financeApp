// src/components/common/Calendar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface CalendarProps {
  visible: boolean;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
}

interface CalendarDatePickerProps {
  label?: string;
  value: Date;
  onDateChange: (date: Date) => void;
  error?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  helperText?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Componente Calendar Modal
const Calendar: React.FC<CalendarProps> = ({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
  minimumDate,
  maximumDate,
  title = 'Selecionar Data',
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const today = new Date();
  const minDate = minimumDate || new Date(1900, 0, 1);
  const maxDate = maximumDate || new Date(2100, 11, 31);

  // Gerar dias do mês
  const generateCalendarDays = () => {
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
      const isSelected = day.toDateString() === selectedDate.toDateString();
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
    if (date >= minDate && date <= maxDate) {
      onDateSelect(date);
      onClose();
    }
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
    onDateSelect(newDate);
    onClose();
  };

  const calendarDays = generateCalendarDays();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarModal}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>

          {/* Opções rápidas */}
          <View style={styles.quickSelectContainer}>
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
          </View>

          {/* Navigation */}
          <View style={styles.calendarNavigation}>
            <TouchableOpacity
              onPress={() => navigateMonth('prev')}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.monthYear}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={() => navigateMonth('next')}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Weekdays */}
          <View style={styles.weekdaysContainer}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={styles.weekdayText}>
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
                        styles.dayButton,
                        !dayData.isCurrentMonth && styles.dayButtonOtherMonth,
                        dayData.isToday && styles.dayButtonToday,
                        dayData.isSelected && styles.dayButtonSelected,
                        dayData.isDisabled && styles.dayButtonDisabled,
                      ]}
                      onPress={() => handleDatePress(dayData.date)}
                      disabled={dayData.isDisabled}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !dayData.isCurrentMonth && styles.dayTextOtherMonth,
                          dayData.isToday && styles.dayTextToday,
                          dayData.isSelected && styles.dayTextSelected,
                          dayData.isDisabled && styles.dayTextDisabled,
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
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Componente DatePicker que usa o Calendar
export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  label,
  value,
  onDateChange,
  error,
  required = false,
  minimumDate,
  maximumDate,
  helperText,
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setIsCalendarVisible(false);
  };

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
        onPress={() => setIsCalendarVisible(true)}
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

      <Calendar
        visible={isCalendarVisible}
        selectedDate={value}
        onDateSelect={handleDateSelect}
        onClose={() => setIsCalendarVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        title={label || 'Selecionar Data'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal
  modalOverlay: {
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

  // Header
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
  closeButton: {
    padding: SPACING.xs,
  },

  // Quick Select
  quickSelectContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickSelectTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickSelectButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primary10,
    borderRadius: BORDER_RADIUS.sm,
  },
  quickSelectButtonText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  // Navigation
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthYear: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },

  // Weekdays
  weekdaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  weekdayText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Calendar Grid
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
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  dayButtonOtherMonth: {
    opacity: 0.3,
  },
  dayButtonToday: {
    backgroundColor: COLORS.primary10,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dayButtonDisabled: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  dayTextOtherMonth: {
    color: COLORS.textSecondary,
  },
  dayTextToday: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  dayTextDisabled: {
    color: COLORS.gray400,
  },

  // Footer
  calendarFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  // DatePicker Wrapper
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
});