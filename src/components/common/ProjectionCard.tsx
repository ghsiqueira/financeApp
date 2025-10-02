import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from './BasicComponents';
import { COLORS, FONTS } from '../../constants';
import { formatCurrency } from '../../utils';

interface ProjectionCardProps {
  projectedBalance: number;
  monthsAhead?: number;
  confidence?: 'high' | 'medium' | 'low';
  insights?: string[];
  onPress?: () => void;
}

export const ProjectionCard: React.FC<ProjectionCardProps> = ({
  projectedBalance,
  monthsAhead = 3,
  confidence = 'medium',
  insights = [],
  onPress,
}) => {
  const navigation = useNavigation();

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return COLORS.success;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.error;
      default: return COLORS.gray400;
    }
  };

  const getConfidenceLabel = () => {
    switch (confidence) {
      case 'high': return 'Alta confiança';
      case 'medium': return 'Confiança média';
      case 'low': return 'Baixa confiança';
      default: return 'Sem dados';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      (navigation as any).navigate('Projections');
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>Projeção Financeira</Text>
            <Text style={styles.subtitle}>Próximos {monthsAhead} meses</Text>
          </View>
        </View>
        
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor() }]}>
          <Text style={styles.confidenceText}>{getConfidenceLabel()}</Text>
        </View>
      </View>

      <View style={styles.projectionContainer}>
        <Text style={styles.projectionLabel}>Saldo projetado:</Text>
        <Text style={[
          styles.projectionValue,
          { color: projectedBalance >= 0 ? COLORS.success : COLORS.error }
        ]}>
          {formatCurrency(projectedBalance)}
        </Text>
        
        <View style={styles.trendIndicator}>
          <Ionicons 
            name={projectedBalance >= 0 ? "arrow-up" : "arrow-down"} 
            size={16} 
            color={projectedBalance >= 0 ? COLORS.success : COLORS.error}
          />
          <Text style={styles.trendText}>
            {projectedBalance >= 0 
              ? "Tendência positiva" 
              : "Atenção: tendência negativa"}
          </Text>
        </View>
      </View>

      {insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <View style={styles.insightRow}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.info} />
            <Text style={styles.insightText} numberOfLines={2}>
              {insights[0]}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.detailsButtonText}>Ver projeções detalhadas</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    color: COLORS.white,
  },
  projectionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 12,
  },
  projectionLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  projectionValue: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    marginBottom: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  insightsContainer: {
    backgroundColor: COLORS.info + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  detailsButtonText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.primary,
  },
});

export default ProjectionCard;