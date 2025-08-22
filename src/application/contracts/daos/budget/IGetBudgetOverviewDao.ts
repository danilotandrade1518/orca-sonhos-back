export interface BudgetCore {
  id: string;
  name: string;
  type: 'PERSONAL' | 'SHARED';
}

export interface BudgetParticipant {
  id: string;
}

export interface BudgetAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface MonthlyAggregates {
  income: number;
  expense: number;
}

export interface IGetBudgetOverviewDao {
  fetchBudgetCore(budgetId: string, userId: string): Promise<BudgetCore | null>;
  fetchParticipants(budgetId: string): Promise<BudgetParticipant[]>;
  fetchAccounts(budgetId: string): Promise<BudgetAccount[]>;
  fetchMonthlyAggregates(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MonthlyAggregates>;
}
