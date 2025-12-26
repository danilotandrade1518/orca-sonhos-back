export interface CategoryFinancialAggregate {
  categoryId: string;
  categoryName: string;
  amount: number;
  transactionCount: number;
}

export interface MonthlyFinancialAnalysisResult {
  period: string;
  totalExpenses: number;
  totalIncome: number;
  deficit: number;
  expensesByCategory: CategoryFinancialAggregate[];
  incomeByCategory: CategoryFinancialAggregate[];
}

export interface IMonthlyFinancialAnalysisDao {
  fetchAnalysis(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<MonthlyFinancialAnalysisResult>;
}
