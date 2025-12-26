import {
  IMonthlyFinancialAnalysisDao,
  MonthlyFinancialAnalysisResult,
  CategoryFinancialAggregate,
} from '@application/contracts/daos/budget/IMonthlyFinancialAnalysisDao';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class MonthlyFinancialAnalysisDao
  implements IMonthlyFinancialAnalysisDao
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async fetchAnalysis(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<MonthlyFinancialAnalysisResult> {
    const { budgetId, periodStart, periodEnd } = params;

    const [totals, incomeByCategory, expensesByCategory] = await Promise.all([
      this.fetchTotals(budgetId, periodStart, periodEnd),
      this.fetchIncomeByCategory(budgetId, periodStart, periodEnd),
      this.fetchExpensesByCategory(budgetId, periodStart, periodEnd),
    ]);

    return {
      period: '',
      totalExpenses: totals.totalExpenses,
      totalIncome: totals.totalIncome,
      deficit: totals.totalExpenses - totals.totalIncome,
      expensesByCategory,
      incomeByCategory,
    };
  }

  private async fetchTotals(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{ totalIncome: number; totalExpenses: number }> {
    const result = await this.connection.query<{
      total_income: string | null;
      total_expenses: string | null;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN -amount ELSE 0 END), 0) AS total_expenses
       FROM transactions
       WHERE budget_id = $1
         AND is_deleted = false
         AND status = 'COMPLETED'
         AND type != 'TRANSFER'
         AND transaction_date >= $2
         AND transaction_date < $3`,
      [budgetId, periodStart, periodEnd],
    );

    const row = result?.rows[0];
    return {
      totalIncome: row ? Number(row.total_income) : 0,
      totalExpenses: row ? Number(row.total_expenses) : 0,
    };
  }

  private async fetchIncomeByCategory(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<CategoryFinancialAggregate[]> {
    const result = await this.connection.query<{
      category_id: string;
      category_name: string;
      amount: string;
      transaction_count: string;
    }>(
      `SELECT
         t.category_id,
         c.name AS category_name,
         COALESCE(SUM(t.amount), 0) AS amount,
         COUNT(*) AS transaction_count
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.budget_id = $1
         AND t.is_deleted = false
         AND t.status = 'COMPLETED'
         AND t.type = 'INCOME'
         AND c.is_deleted = false
         AND t.transaction_date >= $2
         AND t.transaction_date < $3
         AND t.category_id IS NOT NULL
       GROUP BY t.category_id, c.name
       ORDER BY amount ASC`,
      [budgetId, periodStart, periodEnd],
    );

    return (
      result?.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        amount: Number(row.amount),
        transactionCount: Number(row.transaction_count),
      })) || []
    );
  }

  private async fetchExpensesByCategory(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<CategoryFinancialAggregate[]> {
    const result = await this.connection.query<{
      category_id: string;
      category_name: string;
      amount: string;
      transaction_count: string;
    }>(
      `SELECT
         t.category_id,
         c.name AS category_name,
         COALESCE(SUM(-t.amount), 0) AS amount,
         COUNT(*) AS transaction_count
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.budget_id = $1
         AND t.is_deleted = false
         AND t.status = 'COMPLETED'
         AND t.type = 'EXPENSE'
         AND c.is_deleted = false
         AND t.transaction_date >= $2
         AND t.transaction_date < $3
         AND t.category_id IS NOT NULL
       GROUP BY t.category_id, c.name
       ORDER BY amount ASC`,
      [budgetId, periodStart, periodEnd],
    );

    return (
      result?.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        amount: Number(row.amount),
        transactionCount: Number(row.transaction_count),
      })) || []
    );
  }
}
