// src/screens/projections/ProjectionsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Loading, EmptyState } from '../../components/common';
import { ProjectionService, FinancialProjection, WhatIfScenario } from '../../services/ProjectionService';
import { COLORS, FONTS } from '../../constants';
import { formatCurrency } from '../../utils';

const { width } = Dimensions.get('window');

const ProjectionsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projections, setProjections] = useState<FinancialProjection | null>(null);
  const [whatIfAmount, setWhatIfAmount] = useState(500);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfScenario | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showSavingsRateModal, setShowSavingsRateModal] = useState(false);

  useEffect(() => {
    loadProjections();
  }, []);

  const loadProjections = async () => {
    try {
      setLoading(true);
      console.log('🔮 Carregando projeções...');
      
      const data = await ProjectionService.generateProjections(6);
      console.log('✅ Projeções carregadas:', data);
      
      setProjections(data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar projeções:', error);
      Alert.alert('Erro', 'Não foi possível carregar as projeções');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjections();
    setRefreshing(false);
  };

  const handleWhatIf = async () => {
    try {
      setLoading(true);
      const result = await ProjectionService.simulateWhatIf(whatIfAmount);
      setWhatIfResult(result);
      setShowWhatIf(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível simular o cenário');
    } finally {
      setLoading(false);
    }
  };

  // Obter status e cor baseado na taxa de economia
  const getSavingsRateStatus = (rate: number) => {
    if (rate < 0) return { 
      label: 'Crítica', 
      color: COLORS.error, 
      icon: 'alert-circle',
      description: 'Você está gastando mais do que ganha',
      advice: 'Urgente: Revise seus gastos imediatamente e corte despesas não essenciais.'
    };
    if (rate < 5) return { 
      label: 'Alerta', 
      color: COLORS.error, 
      icon: 'warning',
      description: 'Economia muito baixa - vulnerável a imprevistos',
      advice: 'Tente aumentar sua economia para pelo menos 10% da renda.'
    };
    if (rate < 10) return { 
      label: 'Razoável', 
      color: COLORS.warning, 
      icon: 'information-circle',
      description: 'Está economizando, mas pode melhorar',
      advice: 'Bom começo! Busque atingir 10-20% para maior segurança financeira.'
    };
    if (rate < 20) return { 
      label: 'Boa', 
      color: COLORS.success, 
      icon: 'checkmark-circle',
      description: 'Taxa saudável - você está no caminho certo',
      advice: 'Continue assim! Tente aumentar gradualmente para 20%+.'
    };
    if (rate < 30) return { 
      label: 'Ótima', 
      color: COLORS.success, 
      icon: 'star',
      description: 'Excelente controle financeiro',
      advice: 'Parabéns! Você tem ótima disciplina financeira.'
    };
    return { 
      label: 'Excepcional', 
      color: COLORS.primary, 
      icon: 'trophy',
      description: 'Capacidade de poupança muito alta',
      advice: 'Incrível! Considere investir esse excedente para multiplicar seu patrimônio.'
    };
  };

  const savingsRateStatus = projections ? getSavingsRateStatus(projections.savingsRate) : null;

  if (loading && !projections) {
    return <Loading text="Calculando projeções..." />;
  }

  if (!projections) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Projeções</Text>
        </View>
        <EmptyState
          icon="analytics-outline"
          title="Dados insuficientes"
          description="Adicione mais transações para gerar projeções financeiras"
        />
      </SafeAreaView>
    );
  }

  // Preparar dados para gráfico
  const chartData = projections.monthlyProjections.map(p => ({
    month: p.month,
    balance: p.projectedBalance,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projeções Financeiras</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Insights Cards */}
        {projections.insights.length > 0 && (
          <View style={styles.insightsContainer}>
            {projections.insights.map((insight, index) => (
              <Card key={index} style={styles.insightCard}>
                <Text style={styles.insightText}>{insight}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Saldo Atual e Métricas */}
        <Card style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <Text style={styles.cardTitle}>Visão Geral</Text>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.metricLabel}>Saldo Atual</Text>
              <Text style={[styles.metricValue, { 
                color: projections.currentBalance >= 0 ? COLORS.success : COLORS.error 
              }]}>
                {formatCurrency(projections.currentBalance)}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.metricItem}
              onPress={() => setShowSavingsRateModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
              </View>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel}>Taxa de Economia</Text>
                <Ionicons name="bulb" size={16} color={COLORS.warning} />
              </View>
              <Text style={[styles.metricValue, { 
                color: savingsRateStatus?.color || COLORS.success
              }]}>
                {projections.savingsRate.toFixed(1)}%
              </Text>
              <Text style={[styles.metricBadge, { 
                backgroundColor: savingsRateStatus?.color + '20',
                color: savingsRateStatus?.color
              }]}>
                {savingsRateStatus?.label}
              </Text>
            </TouchableOpacity>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="flame" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.metricLabel}>Gasto Mensal Médio</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(projections.burnRate)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Projeção de Saldo */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Projeção de Saldo (6 meses)</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => Alert.alert(
                'Como funciona a projeção?',
                '📊 VALORES ACUMULADOS\n\nOs valores mostram quanto você terá GUARDADO até aquele mês.\n\n💡 Exemplo prático:\n\n• Out: R$ 300\n  → Você economiza R$ 300 neste mês\n  → Total guardado: R$ 300\n\n• Nov: R$ 675\n  → Você economiza R$ 375 neste mês\n  → Total guardado: R$ 300 + R$ 375 = R$ 675\n\nE assim por diante! Cada mês SOMA ao anterior.\n\n\n🎯 CONFIANÇA DA PROJEÇÃO\n\n🟢 ALTA (ícone ✓)\nSeus gastos são estáveis e previsíveis.\nExemplo: Todo mês entre R$ 2.900 - R$ 3.100\n\n🟡 MÉDIA (ícone ⚠)\nSeus gastos variam um pouco.\nExemplo: Entre R$ 2.500 e R$ 3.800\n\n🔴 BAIXA (ícone ⚠)\nSeus gastos variam muito mês a mês.\nExemplo: Entre R$ 2.000 e R$ 6.000\n\nQuanto mais estáveis seus hábitos, mais confiável a projeção!',
                [{ text: 'Entendi', style: 'default' }]
              )}
            >
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Confiança Alta</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Confiança Média</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.legendText}>Confiança Baixa</Text>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartContainer}>
              {projections.monthlyProjections.map((proj, index) => {
                const isPositive = proj.projectedBalance >= 0;
                const maxValue = Math.max(...projections.monthlyProjections.map(p => Math.abs(p.projectedBalance)));
                const barHeight = Math.abs(proj.projectedBalance) / maxValue * 150;

                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <Text style={styles.barValue}>
                        {formatCurrency(proj.projectedBalance)}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: isPositive ? COLORS.success : COLORS.error,
                          },
                        ]}
                      />
                      <View style={[
                        styles.confidenceBadge,
                        { backgroundColor: 
                          proj.confidence === 'high' ? COLORS.success :
                          proj.confidence === 'medium' ? COLORS.warning : COLORS.error
                        }
                      ]}>
                        <Text style={styles.confidenceText}>
                          {proj.confidence === 'high' ? 'Alta' :
                           proj.confidence === 'medium' ? 'Média' : 'Baixa'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{proj.month}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Card>

        {/* Projeção de Metas */}
        {projections.goalProjections.length > 0 && (
          <Card style={styles.goalsCard}>
            <Text style={styles.cardTitle}>Progresso das Metas</Text>
            
            {projections.goalProjections.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.goalTitle}</Text>
                  {goal.needsAcceleration && (
                    <View style={styles.accelerationBadge}>
                      <Ionicons name="warning" size={12} color={COLORS.white} />
                      <Text style={styles.accelerationText}>Acelere!</Text>
                    </View>
                  )}
                </View>

                <View style={styles.goalStats}>
                  <View style={styles.goalStat}>
                    <Text style={styles.goalStatLabel}>Tempo estimado</Text>
                    <Text style={styles.goalStatValue}>
                      {goal.monthsToComplete} {goal.monthsToComplete === 1 ? 'mês' : 'meses'}
                    </Text>
                  </View>
                  <View style={styles.goalStat}>
                    <Text style={styles.goalStatLabel}>Conclusão prevista</Text>
                    <Text style={styles.goalStatValue}>{goal.estimatedCompletionDate}</Text>
                  </View>
                </View>

                <View style={styles.goalAmounts}>
                  <View style={styles.goalAmount}>
                    <Text style={styles.goalAmountLabel}>Economia atual</Text>
                    <Text style={styles.goalAmountValue}>
                      {formatCurrency(goal.currentMonthlyAverage)}/mês
                    </Text>
                  </View>
                  <View style={styles.goalAmount}>
                    <Text style={styles.goalAmountLabel}>Necessário</Text>
                    <Text style={[styles.goalAmountValue, { 
                      color: goal.needsAcceleration ? COLORS.error : COLORS.success 
                    }]}>
                      {formatCurrency(goal.monthlyRequired)}/mês
                    </Text>
                  </View>
                </View>

                {goal.needsAcceleration && (
                  <View style={styles.suggestionBox}>
                    <Ionicons name="bulb" size={16} color={COLORS.primary} />
                    <Text style={styles.suggestionText}>
                      Sugestão: Economize {formatCurrency(goal.suggestedMonthlyAmount)}/mês
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Alertas de Orçamento */}
        {projections.budgetAlerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <Text style={styles.cardTitle}>Alertas de Orçamento</Text>
            
            {projections.budgetAlerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTitleRow}>
                    <Ionicons 
                      name={alert.willExceed ? "warning" : "alert-circle"} 
                      size={20} 
                      color={alert.willExceed ? COLORS.error : COLORS.warning} 
                    />
                    <Text style={styles.alertName}>{alert.budgetName}</Text>
                  </View>
                  <View style={[
                    styles.utilizationBadge,
                    { backgroundColor: alert.utilization > 90 ? COLORS.error : COLORS.warning }
                  ]}>
                    <Text style={styles.utilizationText}>{alert.utilization}%</Text>
                  </View>
                </View>

                <View style={styles.alertDetails}>
                  <View style={styles.alertDetailItem}>
                    <Text style={styles.alertDetailLabel}>Gasto atual</Text>
                    <Text style={styles.alertDetailValue}>{formatCurrency(alert.currentSpent)}</Text>
                  </View>
                  <View style={styles.alertDetailItem}>
                    <Text style={styles.alertDetailLabel}>Limite</Text>
                    <Text style={styles.alertDetailValue}>{formatCurrency(alert.limit)}</Text>
                  </View>
                </View>

                <View style={styles.projectionRow}>
                  <Ionicons name="trending-up" size={16} color={COLORS.gray500} />
                  <Text style={styles.projectionText}>
                    Projeção fim do mês: {formatCurrency(alert.projectedEndOfMonth)}
                  </Text>
                </View>

                {alert.willExceed && (
                  <View style={styles.recommendationBox}>
                    <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.recommendationText}>
                      Limite diário recomendado: {formatCurrency(alert.recommendedDailyLimit)}
                      {' '}({alert.daysRemaining} dias restantes)
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Simulador "E se...?" */}
        <Card style={styles.whatIfCard}>
          <View style={styles.whatIfHeader}>
            <Text style={styles.cardTitle}>Simulador "E se...?"</Text>
            <Ionicons name="bulb" size={24} color={COLORS.primary} />
          </View>
          
          <Text style={styles.whatIfDescription}>
            Veja o impacto de economizar mais a cada mês
          </Text>

          <View style={styles.whatIfControls}>
            <Text style={styles.whatIfLabel}>Economia adicional mensal:</Text>
            
            <View style={styles.amountSelector}>
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => setWhatIfAmount(Math.max(0, whatIfAmount - 100))}
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              <Text style={styles.amountValue}>{formatCurrency(whatIfAmount)}</Text>
              
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => setWhatIfAmount(whatIfAmount + 100)}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Opções rápidas */}
            <View style={styles.quickAmounts}>
              {[200, 500, 1000].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    whatIfAmount === amount && styles.quickAmountButtonActive
                  ]}
                  onPress={() => setWhatIfAmount(amount)}
                >
                  <Text style={[
                    styles.quickAmountText,
                    whatIfAmount === amount && styles.quickAmountTextActive
                  ]}>
                    R$ {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Seletor de Meta */}
            {projections.goalProjections.length > 0 && (
              <View style={styles.goalSelectorContainer}>
                <Text style={styles.whatIfLabel}>Simular para meta específica (opcional):</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalSelector}>
                  <TouchableOpacity
                    style={[
                      styles.goalChip,
                      selectedGoalId === null && styles.goalChipActive
                    ]}
                    onPress={() => setSelectedGoalId(null)}
                  >
                    <Text style={[
                      styles.goalChipText,
                      selectedGoalId === null && styles.goalChipTextActive
                    ]}>
                      Todas as metas
                    </Text>
                  </TouchableOpacity>
                  
                  {projections.goalProjections.map((goal) => (
                    <TouchableOpacity
                      key={goal.goalId}
                      style={[
                        styles.goalChip,
                        selectedGoalId === goal.goalId && styles.goalChipActive
                      ]}
                      onPress={() => setSelectedGoalId(goal.goalId)}
                    >
                      <Ionicons name="flag" size={14} color={selectedGoalId === goal.goalId ? COLORS.white : COLORS.primary} />
                      <Text style={[
                        styles.goalChipText,
                        selectedGoalId === goal.goalId && styles.goalChipTextActive
                      ]}>
                        {goal.goalTitle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={styles.simulateButton}
              onPress={handleWhatIf}
            >
              <Text style={styles.simulateButtonText}>Simular Cenário</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Resultado da Simulação */}
          {showWhatIf && whatIfResult && (
            <View style={styles.whatIfResult}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.resultTitle}>Resultado da Simulação</Text>
              </View>

              <View style={styles.resultSummary}>
                <Text style={styles.resultLabel}>Saldo projetado em 6 meses:</Text>
                <Text style={[styles.resultValue, { color: COLORS.success }]}>
                  {formatCurrency(whatIfResult.projectedBalance)}
                </Text>
                
                <View style={styles.resultBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Cenário atual (sem economia extra):</Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(projections.currentBalance + 
                        projections.monthlyProjections.reduce((acc, m) => acc + m.projectedBalance, 0))}
                    </Text>
                  </View>
                  
                  <View style={styles.breakdownSeparator} />
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>+ Economia extra (R$ {whatIfAmount} × 6 meses):</Text>
                    <Text style={[styles.breakdownValue, { color: COLORS.success }]}>
                      + {formatCurrency(whatIfAmount * 6)}
                    </Text>
                  </View>
                  
                  <View style={styles.breakdownSeparator} />
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabelBold}>Total projetado:</Text>
                    <Text style={[styles.breakdownValueBold, { color: COLORS.success }]}>
                      {formatCurrency(whatIfResult.projectedBalance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.highlightBox}>
                  <Ionicons name="trending-up" size={20} color={COLORS.success} />
                  <Text style={styles.highlightText}>
                    Você terá <Text style={styles.highlightAmount}>{formatCurrency(whatIfAmount * 6)}</Text> a mais economizando R$ {whatIfAmount}/mês
                  </Text>
                </View>
              </View>

              {whatIfResult.goalsImpact.length > 0 && (
                <View style={styles.goalsImpactContainer}>
                  <Text style={styles.impactTitle}>
                    {selectedGoalId ? 'Impacto na Meta Selecionada:' : 'Impacto nas Metas:'}
                  </Text>
                  {whatIfResult.goalsImpact
                    .filter(impact => !selectedGoalId || 
                      projections.goalProjections.find(g => g.goalTitle === impact.goalTitle)?.goalId === selectedGoalId
                    )
                    .map((impact, index) => (
                      <View key={index} style={styles.impactItem}>
                        <Ionicons name="flag" size={16} color={COLORS.primary} />
                        <View style={styles.impactContent}>
                          <Text style={styles.impactGoalName}>{impact.goalTitle}</Text>
                          <Text style={styles.impactDetails}>
                            Conclusão antecipada em {impact.monthsReduced} {impact.monthsReduced === 1 ? 'mês' : 'meses'}
                          </Text>
                          <Text style={styles.impactDate}>
                            Nova data: {impact.newCompletionDate}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Espaçamento inferior */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de Explicação da Taxa de Economia */}
      <Modal
        visible={showSavingsRateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavingsRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="bulb" size={24} color={COLORS.warning} />
                <Text style={styles.modalTitle}>Taxa de Economia</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSavingsRateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              bounces={true}
            >
              {/* Status Atual */}
              {savingsRateStatus && (
                <View style={[styles.statusCard, { backgroundColor: savingsRateStatus.color + '15' }]}>
                  <View style={styles.statusHeader}>
                    <Ionicons name={savingsRateStatus.icon as any} size={32} color={savingsRateStatus.color} />
                    <View style={styles.statusInfo}>
                      <Text style={styles.statusLabel}>Sua taxa atual:</Text>
                      <Text style={[styles.statusValue, { color: savingsRateStatus.color }]}>
                        {projections?.savingsRate.toFixed(1)}% - {savingsRateStatus.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statusDescription}>{savingsRateStatus.description}</Text>
                  <View style={styles.adviceBox}>
                    <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.adviceText}>{savingsRateStatus.advice}</Text>
                  </View>
                </View>
              )}

              {/* O que é */}
              <View style={styles.explanationSection}>
                <Text style={styles.sectionTitle}>O que é?</Text>
                <Text style={styles.sectionText}>
                  A <Text style={styles.bold}>Taxa de Economia</Text> mostra qual porcentagem da sua renda você consegue guardar todo mês.
                </Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaLabel}>Fórmula:</Text>
                  <Text style={styles.formula}>
                    (Receitas - Despesas) ÷ Receitas × 100
                  </Text>
                </View>
              </View>

              {/* Exemplo Prático */}
              <View style={styles.explanationSection}>
                <Text style={styles.sectionTitle}>Exemplo Prático</Text>
                <View style={styles.exampleBox}>
                  <View style={styles.exampleRow}>
                    <Text style={styles.exampleLabel}>Receitas:</Text>
                    <Text style={styles.exampleValue}>R$ 5.000</Text>
                  </View>
                  <View style={styles.exampleRow}>
                    <Text style={styles.exampleLabel}>Despesas:</Text>
                    <Text style={styles.exampleValue}>R$ 4.000</Text>
                  </View>
                  <View style={styles.exampleDivider} />
                  <View style={styles.exampleRow}>
                    <Text style={styles.exampleLabelBold}>Taxa:</Text>
                    <Text style={styles.exampleValueBold}>20%</Text>
                  </View>
                </View>
                <Text style={styles.exampleExplanation}>
                  Isso significa que a cada R$ 100 que você ganha, consegue guardar R$ 20.
                </Text>
              </View>

              {/* Tabela de Referência */}
              <View style={styles.explanationSection}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Tabela de Referência</Text>
                  <View style={styles.scrollHint}>
                    <Ionicons name="arrow-down" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.scrollHintText}>Role para ver mais</Text>
                  </View>
                </View>
                
                <View style={styles.referenceTable}>
                  <View style={[styles.tableRow, { backgroundColor: COLORS.error + '15' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>Negativa</Text>
                      <Text style={styles.tableDescription}>Gastando mais que ganha</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow, { backgroundColor: COLORS.error + '10' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="warning" size={20} color={COLORS.error} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>0% a 5%</Text>
                      <Text style={styles.tableDescription}>Alerta - muito vulnerável</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow, { backgroundColor: COLORS.warning + '15' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>5% a 10%</Text>
                      <Text style={styles.tableDescription}>Razoável - pode melhorar</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow, { backgroundColor: COLORS.success + '15' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>10% a 20%</Text>
                      <Text style={styles.tableDescription}>Boa - taxa saudável</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow, { backgroundColor: COLORS.success + '20' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="star" size={20} color={COLORS.success} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>20% a 30%</Text>
                      <Text style={styles.tableDescription}>Ótima - excelente controle</Text>
                    </View>
                  </View>

                  <View style={[styles.tableRow, { backgroundColor: COLORS.primary + '15' }]}>
                    <View style={styles.tableIcon}>
                      <Ionicons name="trophy" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.tableContent}>
                      <Text style={styles.tableRate}>30%+</Text>
                      <Text style={styles.tableDescription}>Excepcional - capacidade alta</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dicas */}
              <View style={styles.explanationSection}>
                <Text style={styles.sectionTitle}>Como Melhorar</Text>
                
                <View style={styles.tipBox}>
                  <Ionicons name="arrow-up-circle" size={20} color={COLORS.success} />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Aumentar Receitas</Text>
                    <Text style={styles.tipText}>Trabalhos extras, freelance, vendas, qualificação</Text>
                  </View>
                </View>

                <View style={styles.tipBox}>
                  <Ionicons name="arrow-down-circle" size={20} color={COLORS.primary} />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Reduzir Despesas</Text>
                    <Text style={styles.tipText}>Cortar supérfluos, negociar contas, cozinhar em casa</Text>
                  </View>
                </View>

                <View style={styles.tipBox}>
                  <Ionicons name="trophy" size={20} color={COLORS.warning} />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Meta Progressiva</Text>
                    <Text style={styles.tipText}>Melhore 1-2% por mês. Pequenas vitórias somam!</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSavingsRateModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Insights
  insightsContainer: {
    marginTop: 20,
    gap: 10,
  },
  insightCard: {
    padding: 15,
    backgroundColor: COLORS.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  insightText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // Métricas
  metricsCard: {
    marginTop: 20,
    padding: 20,
  },
  metricsHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 5,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 5,
  },
  metricValue: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  metricBadge: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
    textAlign: 'center',
  },

  // Gráfico
  chartCard: {
    marginTop: 20,
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoButton: {
    padding: 5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 20,
    gap: 15,
  },
  barContainer: {
    alignItems: 'center',
    width: 80,
  },
  barWrapper: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  bar: {
    width: 40,
    borderRadius: 5,
    minHeight: 20,
    marginVertical: 10,
  },
  barValue: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.textPrimary,
    marginTop: 5,
    textAlign: 'center',
  },
  confidenceBadge: {
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceText: {
    fontFamily: FONTS.semibold,
    fontSize: 9,
    color: COLORS.white,
  },
  barLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  // Metas
  goalsCard: {
    marginTop: 20,
    padding: 20,
  },
  goalItem: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  accelerationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  accelerationText: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.white,
  },
  goalStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  goalStat: {
    flex: 1,
  },
  goalStatLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  goalStatValue: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  goalAmounts: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  goalAmount: {
    flex: 1,
  },
  goalAmountLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  goalAmountValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  suggestionText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },

  // Alertas
  alertsCard: {
    marginTop: 20,
    padding: 20,
  },
  alertItem: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertName: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  utilizationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  utilizationText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.white,
  },
  alertDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  alertDetailItem: {
    flex: 1,
  },
  alertDetailLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  alertDetailValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  projectionText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  recommendationText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },

  // What If
  whatIfCard: {
    marginTop: 20,
    padding: 20,
  },
  whatIfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  whatIfDescription: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  whatIfControls: {
    gap: 15,
  },
  whatIfLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  amountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountValue: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    minWidth: 150,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  quickAmountButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
  },
  quickAmountButtonActive: {
    backgroundColor: COLORS.primary,
  },
  quickAmountText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quickAmountTextActive: {
    color: COLORS.white,
  },
  goalSelectorContainer: {
    marginTop: 15,
  },
  goalSelector: {
    marginTop: 10,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    marginRight: 10,
    gap: 6,
  },
  goalChipActive: {
    backgroundColor: COLORS.primary,
  },
  goalChipText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  goalChipTextActive: {
    color: COLORS.white,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  simulateButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
  },

  // Resultado What If
  whatIfResult: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  resultTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.success,
  },
  resultSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  resultValue: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    marginBottom: 5,
  },
  resultSubtext: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resultBreakdown: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  breakdownLabelBold: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  breakdownValue: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  breakdownValueBold: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  breakdownSeparator: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 8,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
  },
  highlightText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  highlightAmount: {
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  goalsImpactContainer: {
    gap: 10,
  },
  impactTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  impactContent: {
    flex: 1,
  },
  impactGoalName: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  impactDetails: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.success,
    marginBottom: 2,
  },
  impactDate: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  statusDescription: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  adviceText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  explanationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollHintText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  formulaBox: {
    backgroundColor: COLORS.gray100,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  formulaLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  formula: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  exampleBox: {
    backgroundColor: COLORS.gray100,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  exampleLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  exampleValue: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  exampleLabelBold: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  exampleValueBold: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.success,
  },
  exampleDivider: {
    height: 1,
    backgroundColor: COLORS.gray300,
    marginVertical: 8,
  },
  exampleExplanation: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  referenceTable: {
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  tableIcon: {
    width: 32,
    alignItems: 'center',
  },
  tableContent: {
    flex: 1,
  },
  tableRate: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  tableDescription: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.gray100,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 10,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
  },
});

export default ProjectionsScreen;