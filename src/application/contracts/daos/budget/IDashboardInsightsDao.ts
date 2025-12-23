export interface MonthlyFinancialAggregates {
  incomeMonth: number;
  expenseMonth: number;
}

export interface CategorySpendingAggregate {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
}

export interface EnvelopeLimitsAggregate {
  totalMonthlyLimit: number;
}

export interface AccountsBalanceAggregate {
  totalBalance: number;
}

export interface GoalStatus {
  id: string;
  name: string;
  totalAmount: number;
  accumulatedAmount: number;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardInsightsAggregates {
  monthlyFinancial: MonthlyFinancialAggregates;
  categorySpending: CategorySpendingAggregate[];
  envelopeLimits: EnvelopeLimitsAggregate;
  accountsBalance: AccountsBalanceAggregate;
  goals: GoalStatus[];
}

export interface IDashboardInsightsDao {
  fetchAggregates(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<DashboardInsightsAggregates>;
}
