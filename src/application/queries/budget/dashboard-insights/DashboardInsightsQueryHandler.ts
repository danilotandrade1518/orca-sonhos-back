import { IDashboardInsightsDao } from '@application/contracts/daos/budget/IDashboardInsightsDao';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { IQueryHandler } from '../../shared/IQueryHandler';

export interface DashboardInsightsQuery {
  budgetId: string;
  userId: string;
}

export interface DashboardInsightsQueryResult {
  indicators: {
    budgetUsage: {
      percentage: number;
      value: number;
      status: 'healthy' | 'warning' | 'critical';
      label: string;
      description: string;
    } | null;
    cashFlow: {
      ratio: number;
      absoluteValue: number;
      value: number;
      status: 'healthy' | 'warning' | 'critical';
      label: string;
      description: string;
    } | null;
    goalsOnTrack: {
      percentage: number;
      onTrackCount: number;
      totalActiveCount: number;
      value: number;
      status: 'healthy' | 'warning' | 'critical';
      label: string;
      description: string;
    } | null;
    emergencyReserve: {
      monthsCovered: number;
      value: number;
      status: 'healthy' | 'warning' | 'critical';
      label: string;
      description: string;
    } | null;
  };
  suggestedActions: Array<{
    id: string;
    type:
      | 'goal-contribution'
      | 'emergency-reserve'
      | 'budget-adjustment'
      | 'cash-flow';
    title: string;
    description: string;
    icon: string;
    route: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recentAchievements: Array<{
    id: string;
    type: 'goal-completed' | 'reserve-milestone' | 'budget-maintained';
    message: string;
    date: string;
    icon: string;
  }>;
  categorySpending: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    percentage: number;
    transactionCount: number;
  }>;
}

export class DashboardInsightsQueryHandler
  implements IQueryHandler<DashboardInsightsQuery, DashboardInsightsQueryResult>
{
  constructor(
    private readonly dao: IDashboardInsightsDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    query: DashboardInsightsQuery,
  ): Promise<DashboardInsightsQueryResult> {
    if (!query.budgetId || !query.userId) {
      throw new Error('INVALID_QUERY');
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      query.userId,
      query.budgetId,
    );
    if (auth.hasError) throw auth.errors[0];
    if (!auth.data) throw new InsufficientPermissionsError();

    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const aggregates = await this.dao.fetchAggregates({
      budgetId: query.budgetId,
      periodStart,
      periodEnd,
    });

    const totalExpenseMonth = aggregates.monthlyFinancial.expenseMonth;
    const totalIncomeMonth = aggregates.monthlyFinancial.incomeMonth;
    const categorySpendingWithPercentage = aggregates.categorySpending.map(
      (cat) => ({
        ...cat,
        percentage:
          totalExpenseMonth > 0
            ? Math.round((cat.totalAmount / totalExpenseMonth) * 100)
            : 0,
      }),
    );

    const hasFinancialData = totalIncomeMonth > 0 || totalExpenseMonth > 0;

    const cashFlowRatio =
      totalExpenseMonth > 0
        ? Math.round((totalIncomeMonth / totalExpenseMonth) * 100)
        : 0;
    const cashFlowAbsolute = totalIncomeMonth - totalExpenseMonth;
    const cashFlowStatus =
      cashFlowRatio >= 110
        ? 'healthy'
        : cashFlowRatio >= 100
          ? 'warning'
          : 'critical';

    const envelopeLimitsTotal = aggregates.envelopeLimits.totalMonthlyLimit;
    const budgetUsagePercentage =
      envelopeLimitsTotal > 0
        ? Math.round((totalExpenseMonth / envelopeLimitsTotal) * 100)
        : totalIncomeMonth > 0
          ? Math.round((totalExpenseMonth / totalIncomeMonth) * 100)
          : 0;
    const budgetUsageStatus =
      budgetUsagePercentage <= 80
        ? 'healthy'
        : budgetUsagePercentage <= 100
          ? 'warning'
          : 'critical';

    const activeGoals = aggregates.goals.filter(
      (g) => g.accumulatedAmount < g.totalAmount,
    );
    const goalsOnTrackCount = activeGoals.filter((goal) => {
      if (!goal.deadline) return true;

      const deadline = new Date(goal.deadline);
      if (deadline <= now) {
        return goal.accumulatedAmount >= goal.totalAmount;
      }

      const progress =
        goal.totalAmount > 0
          ? (goal.accumulatedAmount / goal.totalAmount) * 100
          : 0;

      const monthsRemaining = this.calculateMonthsRemaining(now, deadline);
      const expectedProgress =
        monthsRemaining > 0
          ? Math.max(0, 100 - (monthsRemaining / 12) * 100)
          : 100;

      return progress >= expectedProgress;
    }).length;
    const goalsOnTrackPercentage =
      activeGoals.length > 0
        ? Math.round((goalsOnTrackCount / activeGoals.length) * 100)
        : 100;
    const goalsOnTrackStatus =
      goalsOnTrackPercentage >= 75
        ? 'healthy'
        : goalsOnTrackPercentage >= 50
          ? 'warning'
          : 'critical';

    const reserveAmount =
      aggregates.goals.find((g) => g.name.toLowerCase().includes('reserva'))
        ?.accumulatedAmount ?? aggregates.accountsBalance.totalBalance;
    const avgMonthlyExpense = totalExpenseMonth;
    const monthsCovered =
      avgMonthlyExpense > 0
        ? Math.round((reserveAmount / avgMonthlyExpense) * 10) / 10
        : 0;
    const emergencyReserveStatus =
      monthsCovered >= 6
        ? 'healthy'
        : monthsCovered >= 3
          ? 'warning'
          : 'critical';

    const suggestedActions: DashboardInsightsQueryResult['suggestedActions'] =
      [];
    if (hasFinancialData) {
      if (monthsCovered < 3) {
        suggestedActions.push({
          id: 'emergency-reserve-1',
          type: 'emergency-reserve',
          title: 'Construir reserva de emergência',
          description: 'Sua reserva cobre menos de 3 meses de despesas',
          icon: 'shield',
          route: '/goals',
          priority: 'high',
        });
      }
      if (cashFlowRatio < 100) {
        suggestedActions.push({
          id: 'cash-flow-1',
          type: 'cash-flow',
          title: 'Melhorar fluxo de caixa',
          description: 'Suas despesas estão superando suas receitas',
          icon: 'trending-down',
          route: '/reports',
          priority: cashFlowRatio < 90 ? 'high' : 'medium',
        });
      }
      if (budgetUsagePercentage > 100 || budgetUsagePercentage >= 80) {
        suggestedActions.push({
          id: 'budget-adjustment-1',
          type: 'budget-adjustment',
          title: 'Ajustar orçamento',
          description: 'Você está próximo ou acima do limite do orçamento',
          icon: 'pie-chart',
          route: '/envelopes',
          priority: budgetUsagePercentage > 100 ? 'high' : 'medium',
        });
      }
    }
    if (activeGoals.length > 0 && goalsOnTrackPercentage < 75) {
      suggestedActions.push({
        id: 'goal-contribution-1',
        type: 'goal-contribution',
        title: 'Contribuir para metas',
        description: 'Algumas metas estão atrasadas',
        icon: 'target',
        route: '/goals',
        priority: 'medium',
      });
    }

    const recentAchievements: DashboardInsightsQueryResult['recentAchievements'] =
      [];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completedGoals = aggregates.goals.filter(
      (g) =>
        g.accumulatedAmount >= g.totalAmount &&
        g.updatedAt >= sevenDaysAgo &&
        g.updatedAt <= now,
    );
    completedGoals.forEach((goal) => {
      recentAchievements.push({
        id: `achievement-${goal.id}`,
        type: 'goal-completed',
        message: `Meta "${goal.name}" concluída!`,
        date: goal.updatedAt.toISOString(),
        icon: 'trophy',
      });
    });

    return {
      indicators: {
        budgetUsage: hasFinancialData
          ? {
              percentage: budgetUsagePercentage,
              value: budgetUsagePercentage,
              status: budgetUsageStatus,
              label: 'Uso do Orçamento',
              description: `Você está usando ${budgetUsagePercentage}% do seu orçamento`,
            }
          : null,
        cashFlow: hasFinancialData
          ? {
              ratio: cashFlowRatio,
              absoluteValue: cashFlowAbsolute,
              value: cashFlowRatio,
              status: cashFlowStatus,
              label: 'Fluxo de Caixa',
              description: `Receitas representam ${cashFlowRatio}% das despesas`,
            }
          : null,
        goalsOnTrack:
          activeGoals.length > 0
            ? {
                percentage: goalsOnTrackPercentage,
                onTrackCount: goalsOnTrackCount,
                totalActiveCount: activeGoals.length,
                value: goalsOnTrackPercentage,
                status: goalsOnTrackStatus,
                label: 'Metas no Prazo',
                description: `${goalsOnTrackCount} de ${activeGoals.length} metas no prazo`,
              }
            : null,
        emergencyReserve: hasFinancialData
          ? {
              monthsCovered,
              value: monthsCovered,
              status: emergencyReserveStatus,
              label: 'Reserva de Emergência',
              description: `Reserva cobre ${monthsCovered.toFixed(1)} meses de despesas`,
            }
          : null,
      },
      suggestedActions: suggestedActions.slice(0, 3),
      recentAchievements,
      categorySpending: categorySpendingWithPercentage,
    };
  }

  private calculateMonthsRemaining(start: Date, end: Date): number {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();

    let months = yearDiff * 12 + monthDiff;

    if (dayDiff < 0) {
      months -= 1;
    }

    return Math.max(months, 0);
  }
}
