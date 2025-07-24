// src/components/budgets/BudgetRenewalSettings.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useMutation } from '../../hooks/useApi'
import Button from '../common/Button'
import Input from '../common/Input'

interface BudgetRenewalSettingsProps {
  budget: {
    _id: string
    nome: string
    renovacaoAutomatica: boolean
    configuracoes?: {
      renovacao?: {
        rollover?: boolean
        ajusteAutomatico?: boolean
        percentualAjuste?: number
        notificarRenovacao?: boolean
      }
    }
    estatisticasRenovacao?: {
      totalRenovacoes: number
      mediaGastosPorPeriodo: number
      melhorPerformance?: {
        porcentagem: number
        periodo: string
      }
      piorPerformance?: {
        porcentagem: number
        periodo: string
      }
    }
  }
  onUpdate: (budget: any) => void
}

export default function BudgetRenewalSettings({ budget, onUpdate }: BudgetRenewalSettingsProps) {
  const { theme } = useTheme()
  const [showModal, setShowModal] = useState(false)
  const [settings, setSettings] = useState({
    renovacaoAutomatica: budget.renovacaoAutomatica,
    rollover: budget.configuracoes?.renovacao?.rollover || false,
    ajusteAutomatico: budget.configuracoes?.renovacao?.ajusteAutomatico || false,
    percentualAjuste: budget.configuracoes?.renovacao?.percentualAjuste?.toString() || '0',
    notificarRenovacao: budget.configuracoes?.renovacao?.notificarRenovacao ?? true,
  })

  const { mutate: updateSettings, loading } = useMutation()

  const handleSave = async () => {
    try {
      const updateData = {
        renovacaoAutomatica: settings.renovacaoAutomatica,
        configuracoes: {
          ...budget.configuracoes,
          renovacao: {
            rollover: settings.rollover,
            ajusteAutomatico: settings.ajusteAutomatico,
            percentualAjuste: parseFloat(settings.percentualAjuste) || 0,
            notificarRenovacao: settings.notificarRenovacao,
          }
        }
      }

      const response = await updateSettings('patch', `/budgets/renewal/settings/${budget._id}`, updateData)
      
      onUpdate(response.data)
      setShowModal(false)
      
      Alert.alert(
        'Sucesso',
        'Configurações de renovação atualizadas com sucesso!'
      )

    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Erro ao atualizar configurações'
      )
    }
  }

  const handleRenewNow = async () => {
    Alert.alert(
      'Renovar Agora',
      'Tem certeza que deseja renovar este orçamento imediatamente? Esta ação iniciará um novo período.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Renovar',
          style: 'default',
          onPress: async () => {
            try {
              const response = await updateSettings('post', `/budgets/renewal/${budget._id}/renew-now`)
              onUpdate(response.data.orcamento)
              Alert.alert('Sucesso', 'Orçamento renovado com sucesso!')
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao renovar orçamento')
            }
          }
        }
      ]
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      margin: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    settingsButton: {
      padding: 8,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    switchLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    description: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    statsContainer: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    renewButton: {
      marginTop: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    closeButton: {
      padding: 8,
    },
    modalSection: {
      marginBottom: 24,
    },
    inputContainer: {
      marginTop: 8,
    },
    percentageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    percentageInput: {
      flex: 1,
      marginRight: 8,
    },
    percentageLabel: {
      fontSize: 14,
      color: theme.text,
    },
    warningBox: {
      backgroundColor: theme.warning + '20',
      borderLeftWidth: 4,
      borderLeftColor: theme.warning,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    warningText: {
      fontSize: 12,
      color: theme.warning,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
    },
  })

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔄 Renovação Automática</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="settings" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Renovação Automática</Text>
              <Text style={styles.description}>
                Renovar automaticamente quando o período terminar
              </Text>
            </View>
            <Switch
              value={settings.renovacaoAutomatica}
              onValueChange={(value) => setSettings({ ...settings, renovacaoAutomatica: value })}
              trackColor={{ false: theme.border, true: theme.primary + '50' }}
              thumbColor={settings.renovacaoAutomatica ? theme.primary : theme.textSecondary}
            />
          </View>

          {settings.renovacaoAutomatica && (
            <>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Transferir Saldo</Text>
                  <Text style={styles.description}>
                    Adicionar valor não gasto ao próximo período
                  </Text>
                </View>
                <Switch
                  value={settings.rollover}
                  onValueChange={(value) => setSettings({ ...settings, rollover: value })}
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={settings.rollover ? theme.primary : theme.textSecondary}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Ajuste Automático</Text>
                  <Text style={styles.description}>
                    Ajustar limite baseado no histórico de gastos
                  </Text>
                </View>
                <Switch
                  value={settings.ajusteAutomatico}
                  onValueChange={(value) => setSettings({ ...settings, ajusteAutomatico: value })}
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={settings.ajusteAutomatico ? theme.primary : theme.textSecondary}
                />
              </View>
            </>
          )}
        </View>

        {/* Estatísticas de Renovação */}
        {budget.estatisticasRenovacao && budget.estatisticasRenovacao.totalRenovacoes > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Histórico de Renovações</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total de renovações</Text>
                <Text style={styles.statValue}>{budget.estatisticasRenovacao.totalRenovacoes}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Média de gastos por período</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(budget.estatisticasRenovacao.mediaGastosPorPeriodo)}
                </Text>
              </View>
              {budget.estatisticasRenovacao.melhorPerformance && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Melhor performance</Text>
                  <Text style={styles.statValue}>
                    {budget.estatisticasRenovacao.melhorPerformance.porcentagem}%
                  </Text>
                </View>
              )}
              {budget.estatisticasRenovacao.piorPerformance && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Maior gasto</Text>
                  <Text style={styles.statValue}>
                    {budget.estatisticasRenovacao.piorPerformance.porcentagem}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Botão de Renovação Manual */}
        <Button
          title="Renovar Agora"
          onPress={handleRenewNow}
          variant="secondary"
          style={styles.renewButton}
          disabled={!budget.renovacaoAutomatica}
        />
      </View>

      {/* Modal de Configurações Avançadas */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações Avançadas</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Renovação Automática */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Renovação Automática</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Ativada</Text>
                  <Switch
                    value={settings.renovacaoAutomatica}
                    onValueChange={(value) => setSettings({ ...settings, renovacaoAutomatica: value })}
                    trackColor={{ false: theme.border, true: theme.primary + '50' }}
                    thumbColor={settings.renovacaoAutomatica ? theme.primary : theme.textSecondary}
                  />
                </View>
              </View>

              {settings.renovacaoAutomatica && (
                <>
                  {/* Transferir Saldo */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Transferir Saldo Restante</Text>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Ativado</Text>
                      <Switch
                        value={settings.rollover}
                        onValueChange={(value) => setSettings({ ...settings, rollover: value })}
                        trackColor={{ false: theme.border, true: theme.primary + '50' }}
                        thumbColor={settings.rollover ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    <Text style={styles.description}>
                      Quando ativado, o valor não gasto será adicionado ao limite do próximo período.
                    </Text>
                  </View>

                  {/* Ajuste Automático */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Ajuste Automático do Limite</Text>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Ativado</Text>
                      <Switch
                        value={settings.ajusteAutomatico}
                        onValueChange={(value) => setSettings({ ...settings, ajusteAutomatico: value })}
                        trackColor={{ false: theme.border, true: theme.primary + '50' }}
                        thumbColor={settings.ajusteAutomatico ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    
                    {settings.ajusteAutomatico && (
                      <>
                        <View style={styles.inputContainer}>
                          <Text style={styles.switchLabel}>Percentual de Ajuste</Text>
                          <View style={styles.percentageContainer}>
                            <View style={styles.percentageInput}>
                              <Input
                                value={settings.percentualAjuste}
                                onChangeText={(text) => setSettings({ ...settings, percentualAjuste: text })}
                                placeholder="0"
                                keyboardType="numeric"
                              />
                            </View>
                            <Text style={styles.percentageLabel}>%</Text>
                          </View>
                        </View>
                        
                        <View style={styles.warningBox}>
                          <Text style={styles.warningText}>
                            💡 O ajuste será baseado na média dos seus gastos anteriores mais este percentual. 
                            Use valores entre -20% e +50%.
                          </Text>
                        </View>
                      </>
                    )}
                    
                    <Text style={styles.description}>
                      O sistema analisará seu histórico de gastos e ajustará o limite automaticamente.
                    </Text>
                  </View>

                  {/* Notificações */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Notificações</Text>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Notificar Renovações</Text>
                      <Switch
                        value={settings.notificarRenovacao}
                        onValueChange={(value) => setSettings({ ...settings, notificarRenovacao: value })}
                        trackColor={{ false: theme.border, true: theme.primary + '50' }}
                        thumbColor={settings.notificarRenovacao ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    <Text style={styles.description}>
                      Receber email quando o orçamento for renovado automaticamente.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Botões */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancelar"
                onPress={() => setShowModal(false)}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Salvar"
                onPress={handleSave}
                loading={loading}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}