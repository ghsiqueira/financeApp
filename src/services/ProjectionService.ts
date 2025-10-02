import { TransactionService } from './TransactionService';
import { GoalService } from './GoalService';
import { BudgetService } from './BudgetService';
import { Transaction, Goal, Budget } from '../types';

export interface MonthlyProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface GoalProjection {
  goalId: string;
  goalTitle: string;
  currentAmount: number;
  targetAmount: number;
  monthsToComplete: number;
  estimatedCompletionDate: string;
  monthlyRequired: number;
  currentMonthlyAverage: number;
  needsAcceleration: boolean;
  suggestedMonthlyAmount: number;
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  currentSpent: number;
  limit: number;
  utilization: number;
  daysRemaining: number;
  projectedEndOfMonth: number;
  willExceed: boolean;
  recommendedDailyLimit: number;
}

export interface FinancialProjection {
  currentBalance: number;
  monthlyProjections: MonthlyProjection[];
  goalProjections: GoalProjection[];
  budgetAlerts: BudgetAlert[];
  insights: string[];
  savingsRate: number;
  burnRate: number;
}

export interface WhatIfScenario {
  scenario: string;
  monthlySavings: number;
  projectedBalance: number;
  goalsImpact: {
    goalTitle: string;
    monthsReduced: number;
    newCompletionDate: string;
  }[];
}

export class ProjectionService {
  /**
   * Gerar projeções financeiras completas
   */
  static async generateProjections(monthsAhead: number = 6): Promise<FinancialProjection> {
    try {
      console.log('🔮 Gerando projeções financeiras...');

      // Buscar dados necessários
      const [summary, transactions, goals, budgets] = await Promise.all([
        TransactionService.getFinancialSummary(),
        this.getHistoricalTransactions(6), // Últimos 6 meses
        GoalService.getActiveGoals(100),
        BudgetService.getCurrentBudgets(100),
      ]);

      // Calcular projeções mensais
      const monthlyProjections = this.calculateMonthlyProjections(
        transactions,
        monthsAhead
      );

      // Calcular projeções de metas
      const goalProjections = this.calculateGoalProjections(
        Array.isArray(goals) ? goals : [],
        transactions
      );

      // Calcular alertas de orçamento
      const budgetAlerts = this.calculateBudgetAlerts(
        Array.isArray(budgets) ? budgets : [],
        transactions
      );

      // Gerar insights
      const insights = this.generateInsights(
        transactions,
        monthlyProjections,
        goalProjections,
        budgetAlerts
      );

      // Calcular métricas
      const savingsRate = this.calculateSavingsRate(transactions);
      const burnRate = this.calculateBurnRate(transactions);

      return {
        currentBalance: summary.balance,
        monthlyProjections,
        goalProjections,
        budgetAlerts,
        insights,
        savingsRate,
        burnRate,
      };
    } catch (error) {
      console.error('❌ Erro ao gerar projeções:', error);
      throw error;
    }
  }

  /**
   * Buscar transações históricas
   */
  private static async getHistoricalTransactions(months: number): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await TransactionService.getTransactions({
        page,
        limit: 100,
      });

      if (response.success && response.data) {
        const filtered = response.data.filter(t => 
          new Date(t.date) >= startDate
        );
        allTransactions.push(...filtered);

        hasMore = response.pagination ? page < response.pagination.pages : false;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allTransactions;
  }

  /**
   * Calcular projeções mensais
   */
  private static calculateMonthlyProjections(
    transactions: Transaction[],
    monthsAhead: number
  ): MonthlyProjection[] {
    // Agrupar por mês
    const monthlyData = this.groupByMonth(transactions);
    
    // Calcular médias
    const avgIncome = this.calculateAverage(
      monthlyData.map(m => m.income)
    );
    const avgExpenses = this.calculateAverage(
      monthlyData.map(m => m.expenses)
    );

    // Calcular tendência (simples: últimos 3 meses vs 3 anteriores)
    const recentMonths = monthlyData.slice(-3);
    const olderMonths = monthlyData.slice(-6, -3);
    
    const recentAvgIncome = this.calculateAverage(recentMonths.map(m => m.income));
    const recentAvgExpenses = this.calculateAverage(recentMonths.map(m => m.expenses));
    const olderAvgIncome = this.calculateAverage(olderMonths.map(m => m.income));
    const olderAvgExpenses = this.calculateAverage(olderMonths.map(m => m.expenses));

    const incomeTrend = recentAvgIncome - olderAvgIncome;
    const expensesTrend = recentAvgExpenses - olderAvgExpenses;

    // Gerar projeções
    const projections: MonthlyProjection[] = [];
    let cumulativeBalance = 0;

    for (let i = 1; i <= monthsAhead; i++) {
      const projectedIncome = avgIncome + (incomeTrend * (i / 3));
      const projectedExpenses = avgExpenses + (expensesTrend * (i / 3));
      const projectedBalance = projectedIncome - projectedExpenses;
      
      cumulativeBalance += projectedBalance;

      const date = new Date();
      date.setMonth(date.getMonth() + i);

      // Confiança baseada em consistência dos dados
      const variance = this.calculateVariance(monthlyData.map(m => m.expenses));
      const confidence = variance < avgExpenses * 0.2 ? 'high' : 
                        variance < avgExpenses * 0.4 ? 'medium' : 'low';

      projections.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        projectedIncome: Math.round(projectedIncome),
        projectedExpenses: Math.round(projectedExpenses),
        projectedBalance: Math.round(cumulativeBalance),
        confidence,
      });
    }

    return projections;
  }

  /**
   * Calcular projeções de metas
   */
  private static calculateGoalProjections(
    goals: Goal[],
    transactions: Transaction[]
  ): GoalProjection[] {
    const activeGoals = goals.filter(g => g.status === 'active');
    
    // Calcular economia média mensal (receitas - despesas)
    const monthlyData = this.groupByMonth(transactions);
    const monthlySavings = monthlyData.map(m => m.income - m.expenses);
    const avgMonthlySavings = this.calculateAverage(monthlySavings);

    return activeGoals.map(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const currentMonthlyAverage = avgMonthlySavings;
      
      const monthsToComplete = currentMonthlyAverage > 0 
        ? Math.ceil(remaining / currentMonthlyAverage)
        : 999;

      const targetDate = new Date(goal.targetDate || goal.endDate);
      const today = new Date();
      const monthsUntilTarget = Math.max(1, 
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      const monthlyRequired = remaining / monthsUntilTarget;
      const needsAcceleration = monthlyRequired > currentMonthlyAverage;

      const completionDate = new Date();
      completionDate.setMonth(completionDate.getMonth() + monthsToComplete);

      return {
        goalId: goal.id || goal._id,
        goalTitle: goal.title || goal.name || 'Meta sem título',
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        monthsToComplete,
        estimatedCompletionDate: completionDate.toLocaleDateString('pt-BR'),
        monthlyRequired: Math.round(monthlyRequired),
        currentMonthlyAverage: Math.round(currentMonthlyAverage),
        needsAcceleration,
        suggestedMonthlyAmount: Math.round(monthlyRequired * 1.1), // 10% buffer
      };
    });
  }

  /**
   * Calcular alertas de orçamento
   */
  private static calculateBudgetAlerts(
    budgets: Budget[],
    transactions: Transaction[]
  ): BudgetAlert[] {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate();

    return budgets
      .filter(b => b.isActive)
      .map(budget => {
        const currentSpent = budget.spent || 0;
        const limit = budget.monthlyLimit;
        const utilization = (currentSpent / limit) * 100;

        // Projetar gasto até fim do mês
        const spentPerDay = currentSpent / (daysInMonth - daysRemaining);
        const projectedEndOfMonth = currentSpent + (spentPerDay * daysRemaining);
        const willExceed = projectedEndOfMonth > limit;

        const recommendedDailyLimit = daysRemaining > 0 
          ? (limit - currentSpent) / daysRemaining 
          : 0;

        return {
          budgetId: budget.id || budget._id,
          budgetName: budget.name,
          currentSpent: Math.round(currentSpent),
          limit,
          utilization: Math.round(utilization),
          daysRemaining,
          projectedEndOfMonth: Math.round(projectedEndOfMonth),
          willExceed,
          recommendedDailyLimit: Math.max(0, Math.round(recommendedDailyLimit)),
        };
      })
      .filter(alert => alert.utilization > 70 || alert.willExceed);
  }

  /**
   * Gerar insights inteligentes
   */
  private static generateInsights(
    transactions: Transaction[],
    monthlyProjections: MonthlyProjection[],
    goalProjections: GoalProjection[],
    budgetAlerts: BudgetAlert[]
  ): string[] {
    const insights: string[] = [];
    const monthlyData = this.groupByMonth(transactions);

    // Insight 1: Tendência de gastos
    if (monthlyData.length >= 2) {
      const lastMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      const change = ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;

      if (Math.abs(change) > 10) {
        insights.push(
          change > 0
            ? `⚠️ Seus gastos aumentaram ${change.toFixed(0)}% em relação ao mês anterior`
            : `✅ Você economizou ${Math.abs(change).toFixed(0)}% a mais que o mês anterior!`
        );
      }
    }

    // Insight 2: Projeção de saldo
    const lastProjection = monthlyProjections[monthlyProjections.length - 1];
    if (lastProjection) {
      if (lastProjection.projectedBalance > 0) {
        insights.push(
          `📈 Em ${monthlyProjections.length} meses, você terá aproximadamente R$ ${lastProjection.projectedBalance.toLocaleString('pt-BR')}`
        );
      } else {
        insights.push(
          `⚠️ Atenção! No ritmo atual, seu saldo pode ficar negativo em ${monthlyProjections.length} meses`
        );
      }
    }

    // Insight 3: Metas atrasadas
    const delayedGoals = goalProjections.filter(g => g.needsAcceleration);
    if (delayedGoals.length > 0) {
      insights.push(
        `🎯 ${delayedGoals.length} meta(s) precisam de mais economia para serem atingidas no prazo`
      );
    }

    // Insight 4: Orçamentos em risco
    const riskyBudgets = budgetAlerts.filter(b => b.willExceed);
    if (riskyBudgets.length > 0) {
      insights.push(
        `💰 ${riskyBudgets.length} orçamento(s) podem ser excedidos até o fim do mês`
      );
    }

    // Insight 5: Taxa de economia
    const avgIncome = this.calculateAverage(monthlyData.map(m => m.income));
    const avgExpenses = this.calculateAverage(monthlyData.map(m => m.expenses));
    const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpenses) / avgIncome) * 100 : 0;

    if (savingsRate > 20) {
      insights.push(`🌟 Excelente! Você economiza ${savingsRate.toFixed(0)}% da sua renda`);
    } else if (savingsRate > 0) {
      insights.push(`💡 Tente aumentar sua taxa de economia atual de ${savingsRate.toFixed(0)}%`);
    }

    return insights;
  }

  /**
   * Simular cenário "E se...?"
   */
  static async simulateWhatIf(additionalMonthlySavings: number): Promise<WhatIfScenario> {
    const projections = await this.generateProjections(6);
    
    const newBalance = projections.monthlyProjections.reduce((acc, month) => 
      acc + month.projectedBalance + additionalMonthlySavings, 
      projections.currentBalance
    );

    const goalsImpact = projections.goalProjections.map(goal => {
      const newMonthlyAmount = goal.currentMonthlyAverage + additionalMonthlySavings;
      const remaining = goal.targetAmount - goal.currentAmount;
      const newMonthsToComplete = Math.ceil(remaining / newMonthlyAmount);
      const monthsReduced = goal.monthsToComplete - newMonthsToComplete;

      const newDate = new Date();
      newDate.setMonth(newDate.getMonth() + newMonthsToComplete);

      return {
        goalTitle: goal.goalTitle,
        monthsReduced,
        newCompletionDate: newDate.toLocaleDateString('pt-BR'),
      };
    });

    return {
      scenario: `Economizando R$ ${additionalMonthlySavings.toLocaleString('pt-BR')} a mais por mês`,
      monthlySavings: additionalMonthlySavings,
      projectedBalance: Math.round(newBalance),
      goalsImpact,
    };
  }

  /**
   * Utilitários
   */
  private static groupByMonth(transactions: Transaction[]) {
    const monthlyMap: { [key: string]: { income: number; expenses: number } } = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        monthlyMap[monthKey].income += t.amount;
      } else if (t.type === 'expense') {
        monthlyMap[monthKey].expenses += t.amount;
      }
    });

    return Object.keys(monthlyMap)
      .sort()
      .map(key => monthlyMap[key]);
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateVariance(values: number[]): number {
    const avg = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.calculateAverage(squaredDiffs));
  }

  private static calculateSavingsRate(transactions: Transaction[]): number {
    const monthlyData = this.groupByMonth(transactions);
    const avgIncome = this.calculateAverage(monthlyData.map(m => m.income));
    const avgExpenses = this.calculateAverage(monthlyData.map(m => m.expenses));
    
    return avgIncome > 0 ? ((avgIncome - avgExpenses) / avgIncome) * 100 : 0;
  }

  private static calculateBurnRate(transactions: Transaction[]): number {
    const monthlyData = this.groupByMonth(transactions);
    const avgExpenses = this.calculateAverage(monthlyData.map(m => m.expenses));
    return avgExpenses;
  }
}