import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Line, Circle, Path, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.xl * 2;
const CHART_HEIGHT = 250;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const GRAPH_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const GRAPH_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

interface LineChartData {
  label: string;
  value: number;
  secondValue?: number;
}

interface LineChartProps {
  data: LineChartData[];
  color?: string;
  secondColor?: string;
  showGrid?: boolean;
  showDots?: boolean;
  showGradient?: boolean;
  formatValue?: (value: number) => string;
  curved?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = COLORS.primary,
  secondColor = COLORS.secondary,
  showGrid = true,
  showDots = true,
  showGradient = true,
  formatValue = (v) => v.toFixed(0),
  curved = true,
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
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => {
    return PADDING.left + (index / Math.max(data.length - 1, 1)) * GRAPH_WIDTH;
  };

  const getY = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    return PADDING.top + GRAPH_HEIGHT - normalized * GRAPH_HEIGHT;
  };

  const createLinePath = (useSecondValue = false) => {
    if (data.length === 0) return '';

    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(useSecondValue && d.secondValue !== undefined ? d.secondValue : d.value),
    }));

    if (!curved || points.length < 2) {
      // Linha reta
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    }

    // Linha curva suave (Catmull-Rom Spline)
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const createGradientPath = (useSecondValue = false) => {
    const linePath = createLinePath(useSecondValue);
    if (!linePath) return '';
    
    const lastX = getX(data.length - 1);
    const bottomY = PADDING.top + GRAPH_HEIGHT;

    return `${linePath} L ${lastX} ${bottomY} L ${PADDING.left} ${bottomY} Z`;
  };

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

  const renderYAxisLabels = () => {
    const numLabels = 5;
    const labels = [];

    for (let i = 0; i <= numLabels; i++) {
      const value = minValue + (valueRange * i) / numLabels;
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

  const renderXAxisLabels = () => {
    const step = Math.ceil(data.length / 6);
    
    return data.map((d, i) => {
      if (i % step !== 0 && i !== data.length - 1) return null;

      return (
        <SvgText
          key={`x-label-${i}`}
          x={getX(i)}
          y={PADDING.top + GRAPH_HEIGHT + 20}
          fontSize={FONT_SIZES.xs}
          fontFamily={FONTS.regular}
          fill={COLORS.gray500}
          textAnchor="middle"
        >
          {d.label}
        </SvgText>
      );
    });
  };

  const renderDots = (useSecondValue = false, dotColor = color) => {
    if (!showDots) return null;

    return data.map((d, i) => {
      const value = useSecondValue && d.secondValue !== undefined ? d.secondValue : d.value;
      const x = getX(i);
      const y = getY(value);

      return (
        <G key={`dot-${i}-${useSecondValue}`}>
          <Circle
            cx={x}
            cy={y}
            r={5}
            fill={COLORS.white}
            stroke={dotColor}
            strokeWidth={3}
          />
        </G>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </LinearGradient>
          <LinearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={secondColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={secondColor} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {renderGrid()}

        {/* Gradiente da primeira linha */}
        {showGradient && (
          <Path
            d={createGradientPath(false)}
            fill="url(#gradient1)"
          />
        )}

        {/* Gradiente da segunda linha */}
        {showGradient && hasSecondValue && (
          <Path
            d={createGradientPath(true)}
            fill="url(#gradient2)"
          />
        )}

        {/* Linhas */}
        <Path
          d={createLinePath(false)}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hasSecondValue && (
          <Path
            d={createLinePath(true)}
            stroke={secondColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Pontos */}
        {renderDots(false, color)}
        {hasSecondValue && renderDots(true, secondColor)}

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

        {renderYAxisLabels()}
        {renderXAxisLabels()}
      </Svg>

      {/* Legenda para duas linhas */}
      {hasSecondValue && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={styles.legendText}>Receitas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: secondColor }]} />
            <Text style={styles.legendText}>Despesas</Text>
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