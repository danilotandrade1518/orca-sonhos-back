import { IMonthlyFinancialAnalysisDao } from '@application/contracts/daos/budget/IMonthlyFinancialAnalysisDao';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';

import { IQueryHandler } from '../../shared/IQueryHandler';

export interface MonthlyFinancialAnalysisQuery {
  budgetId: string;
  userId: string;
}

export interface MonthlyFinancialAnalysisQueryResult {
  period: string;
  totalExpenses: number;
  totalIncome: number;
  deficit: number;
  expensesByCategory: {
    categoryId: string;
    categoryName: string;
    amount: number;
    transactionCount: number;
  }[];
  incomeByCategory: {
    categoryId: string;
    categoryName: string;
    amount: number;
    transactionCount: number;
  }[];
}

export class MonthlyFinancialAnalysisQueryHandler
  implements
    IQueryHandler<
      MonthlyFinancialAnalysisQuery,
      MonthlyFinancialAnalysisQueryResult
    >
{
  constructor(
    private readonly dao: IMonthlyFinancialAnalysisDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    query: MonthlyFinancialAnalysisQuery,
  ): Promise<MonthlyFinancialAnalysisQueryResult> {
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

    const result = await this.dao.fetchAnalysis({
      budgetId: query.budgetId,
      periodStart,
      periodEnd,
    });

    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    return {
      period,
      totalExpenses: result.totalExpenses,
      totalIncome: result.totalIncome,
      deficit: result.deficit,
      expensesByCategory: result.expensesByCategory,
      incomeByCategory: result.incomeByCategory,
    };
  }
}
