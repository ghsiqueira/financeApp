import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Circle, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - SPACING.xl * 2;
const RADIUS = CHART_SIZE / 3;
const CENTER = CHART_SIZE / 2;

interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface PieChartProps {
  data: PieChartData[];
  showLabels?: boolean;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  showLabels = true,
  showLegend = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  // Calcular ângulos para cada fatia
  const createPieSlices = () => {
    let currentAngle = -90; // Começar no topo
    
    return data.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle = endAngle;
      
      return {
        ...item,
        startAngle,
        endAngle,
        angle,
      };
    });
  };

  // Converter ângulo para coordenadas
  const polarToCartesian = (angle: number, radius: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;
    return {
      x: CENTER + radius * Math.cos(angleInRadians),
      y: CENTER + radius * Math.sin(angleInRadians),
    };
  };

  // Criar path do arco
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, RADIUS);
    const end = polarToCartesian(endAngle, RADIUS);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${CENTER} ${CENTER}`,
      `L ${start.x} ${start.y}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  const slices = createPieSlices();

  // Renderizar labels
  const renderLabels = () => {
    if (!showLabels) return null;

    return slices.map((slice, index) => {
      if (slice.percentage < 5) return null; // Não mostrar labels muito pequenos

      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      const labelRadius = RADIUS * 0.7;
      const labelPos = polarToCartesian(midAngle, labelRadius);

      return (
        <SvgText
          key={`label-${index}`}
          x={labelPos.x}
          y={labelPos.y}
          fontSize={FONT_SIZES.sm}
          fontFamily={FONTS.bold}
          fill={COLORS.white}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {slice.percentage.toFixed(0)}%
        </SvgText>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <G>
          {slices.map((slice, index) => (
            <Path
              key={`slice-${index}`}
              d={createArc(slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={0.9}
            />
          ))}
          {renderLabels()}
          
          {/* Centro branco para criar efeito donut */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * 0.4}
            fill={COLORS.white}
          />
        </G>
      </Svg>

      {/* Legenda */}
      {showLegend && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.legendValue}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
  },
  legend: {
    marginTop: SPACING.lg,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  legendValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
});