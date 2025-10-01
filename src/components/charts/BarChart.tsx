// src/components/charts/BarChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.xl * 2;
const CHART_HEIGHT = 280;
const PADDING = { top: 20, right: 20, bottom: 60, left: 50 };
const GRAPH_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const GRAPH_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

interface BarChartData {
  label: string;
  value: number;
  secondValue?: number; // Para gráfico de barras agrupadas
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  color?: string;
  secondColor?: string;
  showGrid?: boolean;
  showValues?: boolean;
  showGradient?: boolean;
  formatValue?: (value: number) => string;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  color = COLORS.primary,
  secondColor = COLORS.secondary,
  showGrid = true,
  showValues = true,
  showGradient = true,
  formatValue = (v) => v.toFixed(0),
  horizontal = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  const hasSecondValue = data.some(d => d.secondValue !== undefined);
  const allValues = data.flatMap(d => [d.value, d.secondValue || 0]);
  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;
  const valueRange = maxValue - minValue;

  // Largura de cada barra
  const barSpacing = GRAPH_WIDTH / data.length;
  const barWidth = hasSecondValue 
    ? (barSpacing * 0.35) 
    : (barSpacing * 0.6);
  const groupPadding = barSpacing * 0.1;

  // Calcular altura da barra
  const getBarHeight = (value: number) => {
    return (value / maxValue) * GRAPH_HEIGHT;
  };

  // Calcular posição X da barra
  const getBarX = (index: number, isSecond = false) => {
    const centerX = PADDING.left + (index + 0.5) * barSpacing;
    
    if (hasSecondValue) {
      return isSecond 
        ? centerX + groupPadding / 2
        : centerX - barWidth - groupPadding / 2;
    }
    
    return centerX - barWidth / 2;
  };

  // Calcular posição Y da barra
  const getBarY = (value: number) => {
    const barHeight = getBarHeight(value);
    return PADDING.top + GRAPH_HEIGHT - barHeight;
  };

  // Renderizar grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const numLines = 5;

    for (let i = 0; i <= numLines; i++) {
      const y = PADDING.top + (i / numLines) * GRAPH_HEIGHT;
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={PADDING.left}
          y1={y}
          x2={PADDING.left + GRAPH_WIDTH}
          y2={y}
          stroke={COLORS.gray200}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      );
    }

    return <G>{gridLines}</G>;
  };

  // Renderizar labels do eixo Y
  const renderYAxisLabels = () => {
    const numLabels = 5;
    const labels = [];

    for (let i = 0; i <= numLabels; i++) {
      const value = (maxValue * i) / numLabels;
      const y = PADDING.top + GRAPH_HEIGHT - (i / numLabels) * GRAPH_HEIGHT;

      labels.push(
        <SvgText
          key={`y-label-${i}`}
          x={PADDING.left - 10}
          y={y}
          fontSize={FONT_SIZES.xs}
          fontFamily={FONTS.regular}
          fill={COLORS.gray500}
          textAnchor="end"
          alignmentBaseline="middle"
        >
          {formatValue(value)}
        </SvgText>
      );
    }

    return <G>{labels}</G>;
  };

  // Renderizar labels do eixo X
  const renderXAxisLabels = () => {
    return data.map((d, i) => {
      const centerX = PADDING.left + (i + 0.5) * barSpacing;
      
      // Quebrar label em múltiplas linhas se for muito longo
      const words = d.label.split(' ');
      const shouldBreak = d.label.length > 8;
      
      if (shouldBreak && words.length > 1) {
        return (
          <G key={`x-label-${i}`}>
            <SvgText
              x={centerX}
              y={PADDING.top + GRAPH_HEIGHT + 15}
              fontSize={FONT_SIZES.xs}
              fontFamily={FONTS.regular}
              fill={COLORS.gray500}
              textAnchor="middle"
            >
              {words[0]}
            </SvgText>
            <SvgText
              x={centerX}
              y={PADDING.top + GRAPH_HEIGHT + 28}
              fontSize={FONT_SIZES.xs}
              fontFamily={FONTS.regular}
              fill={COLORS.gray500}
              textAnchor="middle"
            >
              {words.slice(1).join(' ')}
            </SvgText>
          </G>
        );
      }

      return (
        <SvgText
          key={`x-label-${i}`}
          x={centerX}
          y={PADDING.top + GRAPH_HEIGHT + 20}
          fontSize={FONT_SIZES.xs}
          fontFamily={FONTS.regular}
          fill={COLORS.gray500}
          textAnchor="middle"
        >
          {d.label.length > 10 ? d.label.substring(0, 10) + '...' : d.label}
        </SvgText>
      );
    });
  };

  // Renderizar valores acima das barras
  const renderValues = () => {
    if (!showValues) return null;

    return data.map((d, i) => {
      const elements = [];

      // Primeira barra
      const x1 = getBarX(i) + barWidth / 2;
      const y1 = getBarY(d.value) - 8;
      
      elements.push(
        <SvgText
          key={`value-1-${i}`}
          x={x1}
          y={y1}
          fontSize={FONT_SIZES.xs}
          fontFamily={FONTS.semibold}
          fill={d.color || color}
          textAnchor="middle"
        >
          {formatValue(d.value)}
        </SvgText>
      );

      // Segunda barra (se houver)
      if (hasSecondValue && d.secondValue !== undefined) {
        const x2 = getBarX(i, true) + barWidth / 2;
        const y2 = getBarY(d.secondValue) - 8;
        
        elements.push(
          <SvgText
            key={`value-2-${i}`}
            x={x2}
            y={y2}
            fontSize={FONT_SIZES.xs}
            fontFamily={FONTS.semibold}
            fill={secondColor}
            textAnchor="middle"
          >
            {formatValue(d.secondValue)}
          </SvgText>
        );
      }

      return <G key={`values-${i}`}>{elements}</G>;
    });
  };

  // Renderizar barras
  const renderBars = () => {
    return data.map((d, i) => {
      const elements = [];
      const barColor = d.color || color;

      // Primeira barra
      const x1 = getBarX(i);
      const y1 = getBarY(d.value);
      const height1 = getBarHeight(d.value);

      elements.push(
        <G key={`bar-1-${i}`}>
          {showGradient && (
            <Defs>
              <LinearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={barColor} stopOpacity={1} />
                <Stop offset="100%" stopColor={barColor} stopOpacity={0.7} />
              </LinearGradient>
            </Defs>
          )}
          <Rect
            x={x1}
            y={y1}
            width={barWidth}
            height={height1}
            fill={showGradient ? `url(#gradient-${i})` : barColor}
            rx={4}
            ry={4}
          />
        </G>
      );

      // Segunda barra (se houver)
      if (hasSecondValue && d.secondValue !== undefined) {
        const x2 = getBarX(i, true);
        const y2 = getBarY(d.secondValue);
        const height2 = getBarHeight(d.secondValue);

        elements.push(
          <G key={`bar-2-${i}`}>
            {showGradient && (
              <Defs>
                <LinearGradient id={`gradient2-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={secondColor} stopOpacity={1} />
                  <Stop offset="100%" stopColor={secondColor} stopOpacity={0.7} />
                </LinearGradient>
              </Defs>
            )}
            <Rect
              x={x2}
              y={y2}
              width={barWidth}
              height={height2}
              fill={showGradient ? `url(#gradient2-${i})` : secondColor}
              rx={4}
              ry={4}
            />
          </G>
        );
      }

      return <G key={`bars-${i}`}>{elements}</G>;
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid */}
        {renderGrid()}

        {/* Barras */}
        {renderBars()}

        {/* Valores */}
        {renderValues()}

        {/* Eixos */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top + GRAPH_HEIGHT}
          x2={PADDING.left + GRAPH_WIDTH}
          y2={PADDING.top + GRAPH_HEIGHT}
          stroke={COLORS.gray300}
          strokeWidth={2}
        />
        <Line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + GRAPH_HEIGHT}
          stroke={COLORS.gray300}
          strokeWidth={2}
        />

        {/* Labels */}
        {renderYAxisLabels()}
        {renderXAxisLabels()}
      </Svg>

      {/* Legenda para barras agrupadas */}
      {hasSecondValue && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={styles.legendText}>Principal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: secondColor }]} />
            <Text style={styles.legendText}>Comparação</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});