export interface BudgetCore {
  id: string;
  name: string;
  type: string;
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
  fetchBudgetCore(params: { budgetId: string }): Promise<BudgetCore | null>;

  fetchParticipants(params: { budgetId: string }): Promise<BudgetParticipant[]>;

  fetchAccounts(params: { budgetId: string }): Promise<BudgetAccount[]>;

  fetchMonthlyAggregates(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<MonthlyAggregates>;
}
