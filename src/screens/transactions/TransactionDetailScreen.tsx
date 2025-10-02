// src/screens/transactions/TransactionDetailScreen.tsx - CÓDIGO COMPLETO COM EMOJI AJUSTADO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';

import { TransactionStackParamList } from '../../navigation/TransactionNavigator';
import { TransactionService } from '../../services/TransactionService';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils';
import { Card } from '../../components/common';

type TransactionDetailNavigationProp = StackNavigationProp<TransactionStackParamList, 'TransactionDetails'>;
type TransactionDetailRouteProp = RouteProp<TransactionStackParamList, 'TransactionDetails'>;

interface Props {
  navigation: TransactionDetailNavigationProp;
  route: TransactionDetailRouteProp;
}

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [transactionId])
  );

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await TransactionService.getTransaction(transactionId);
      
      if (response.success && response.data) {
        setTransaction(response.data);
      } else {
        Alert.alert('Erro', 'Transação não encontrada', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar transação:', error);
      Alert.alert('Erro', error.message || 'Erro ao carregar transação', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!transaction) {
      Alert.alert('Erro', 'Transação não carregada');
      return;
    }

    const idToUse = transaction._id || transaction.id;
    
    if (!idToUse) {
      Alert.alert('Erro', 'ID da transação não encontrado');
      return;
    }
    
    navigation.navigate('EditTransaction', { transactionId: idToUse });
  };

  const handleDelete = () => {
    if (!transaction) {
      Alert.alert('Erro', 'Transação não carregada');
      return;
    }

    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a transação "${transaction.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const idToUse = transaction._id || transaction.id;
              await TransactionService.deleteTransaction(idToUse);
              Alert.alert('Sucesso', 'Transação excluída com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              console.error('Erro ao excluir transação:', error);
              Alert.alert('Erro', error.message || 'Erro ao excluir transação');
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    if (!transaction) return;

    const shareText = `Transação: ${transaction.description}
Valor: ${formatCurrency(transaction.amount)}
Tipo: ${transaction.type === 'income' ? 'Receita' : 'Despesa'}
Data: ${new Date(transaction.date).toLocaleDateString('pt-BR')}
${transaction.notes ? `Notas: ${transaction.notes}` : ''}`;

    Alert.alert('Compartilhar', shareText);
  };

  const getCategoryInfo = (): { name: string; icon: string; color: string; isEmoji: boolean } => {
    if (!transaction?.category) {
      return { name: 'Sem categoria', icon: '💰', color: '#4CAF50', isEmoji: true };
    }
    
    if (typeof transaction.category === 'string') {
      return { name: transaction.category, icon: '💰', color: '#4CAF50', isEmoji: true };
    }
    
    if (typeof transaction.category === 'object') {
      const icon = transaction.category.icon || '💰';
      const isEmoji = !icon.includes('-') && !icon.includes('outline');
      
      return {
        name: transaction.category.name || 'Sem categoria',
        icon: icon,
        color: transaction.category.color || '#4CAF50',
        isEmoji: isEmoji,
      };
    }
    
    return { name: 'Sem categoria', icon: '💰', color: '#4CAF50', isEmoji: true };
  };

  const getBudgetInfo = (): { hasBudget: false } | { 
    hasBudget: true; 
    budgetName: string; 
    spent: number; 
    limit: number; 
    isOverBudget: boolean; 
    remaining: number; 
    percentage: number;
  } => {
    if (!transaction) return { hasBudget: false };
    
    if (transaction.budgetId && typeof transaction.budgetId === 'object') {
      const spent = transaction.budgetId.spent || 0;
      const limit = transaction.budgetId.monthlyLimit || 0;
      const remaining = Math.max(0, limit - spent);
      const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
      
      return {
        hasBudget: true,
        budgetName: transaction.budgetId.name || 'Orçamento',
        spent,
        limit,
        isOverBudget: transaction.budgetId.isOverBudget || spent > limit,
        remaining,
        percentage,
      };
    }
    
    return { hasBudget: false };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Transação não encontrada</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = getCategoryInfo();
  const budgetInfo = getBudgetInfo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Detalhes</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={22} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleEdit}
            style={styles.headerButton}
          >
            <Ionicons name="pencil-outline" size={22} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleDelete}
            style={styles.headerButton}
          >
            <Ionicons name="trash-outline" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Principal */}
        <Card style={styles.mainCard}>
          <View style={styles.transactionHeader}>
            <View style={[
              styles.typeIndicator,
              { backgroundColor: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
            ]}>
              <Ionicons 
                name={transaction.type === 'income' ? 'trending-up' : 'trending-down'} 
                size={24} 
                color="#FFF" 
              />
            </View>
            
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
              ]}>
                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Informações Detalhadas */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {/* Categoria */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Categoria</Text>
            </View>
            <View style={styles.categoryDisplay}>
              <View style={[
                styles.categoryIconContainer,
                { backgroundColor: categoryInfo.color + '20' }
              ]}>
                {categoryInfo.isEmoji ? (
                  <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
                ) : (
                  <Ionicons 
                    name={categoryInfo.icon as any}
                    size={14} 
                    color={categoryInfo.color}
                  />
                )}
              </View>
              <Text style={styles.detailValue}>{categoryInfo.name}</Text>
            </View>
          </View>

          {/* Data */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Data</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(transaction.date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Tipo */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="swap-vertical-outline" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Tipo</Text>
            </View>
            <View style={styles.typeDisplay}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
              ]}>
                <Text style={styles.typeBadgeText}>
                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                </Text>
              </View>
            </View>
          </View>

          {/* Recorrência */}
          {transaction.isRecurring && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="repeat-outline" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Recorrência</Text>
              </View>
              <Text style={styles.detailValue}>
                Todo dia {transaction.recurringDay} do mês
              </Text>
            </View>
          )}

          {/* Notas */}
          {transaction.notes && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Notas</Text>
              </View>
              <Text style={styles.detailValue}>{transaction.notes}</Text>
            </View>
          )}
        </Card>

        {/* Orçamento */}
        {budgetInfo.hasBudget && (
          <Card style={styles.budgetCard}>
            <Text style={styles.sectionTitle}>Orçamento Relacionado</Text>
            
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetName}>{budgetInfo.budgetName}</Text>
              <Text style={[
                styles.budgetStatus,
                { color: budgetInfo.isOverBudget ? '#F44336' : '#4CAF50' }
              ]}>
                {budgetInfo.isOverBudget ? 'Excedido' : 'Dentro do limite'}
              </Text>
            </View>

            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(100, budgetInfo.percentage)}%`,
                    backgroundColor: budgetInfo.isOverBudget ? '#F44336' : '#4CAF50'
                  }
                ]} />
              </View>
              <Text style={styles.progressText}>
                {budgetInfo.percentage.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.budgetDetails}>
              <View style={styles.budgetDetailItem}>
                <Text style={styles.budgetDetailLabel}>Gasto</Text>
                <Text style={styles.budgetDetailValue}>
                  {formatCurrency(budgetInfo.spent)}
                </Text>
              </View>
              
              <View style={styles.budgetDetailItem}>
                <Text style={styles.budgetDetailLabel}>Limite</Text>
                <Text style={styles.budgetDetailValue}>
                  {formatCurrency(budgetInfo.limit)}
                </Text>
              </View>
              
              <View style={styles.budgetDetailItem}>
                <Text style={styles.budgetDetailLabel}>Restante</Text>
                <Text style={[
                  styles.budgetDetailValue,
                  { color: budgetInfo.isOverBudget ? '#F44336' : '#4CAF50' }
                ]}>
                  {formatCurrency(budgetInfo.remaining)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Metadados */}
        <Card style={styles.metadataCard}>
          <Text style={styles.sectionTitle}>Informações Técnicas</Text>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>ID da Transação</Text>
            <Text style={styles.metadataValue}>{transaction._id || transaction.id}</Text>
          </View>
          
          {transaction.createdAt && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Criado em</Text>
              <Text style={styles.metadataValue}>
                {new Date(transaction.createdAt).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
          
          {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Última edição</Text>
              <Text style={styles.metadataValue}>
                {new Date(transaction.updatedAt).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil-outline" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteAction]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    marginBottom: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  typeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabelText: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  typeDisplay: {
    flex: 1,
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  budgetCard: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetailItem: {
    alignItems: 'center',
  },
  budgetDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  metadataCard: {
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#666',
  },
  metadataValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  deleteAction: {
    borderColor: '#F44336',
  },
  deleteActionText: {
    color: '#F44336',
  },
});

export default TransactionDetailScreen;