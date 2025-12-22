import {
  IDashboardInsightsDao,
  DashboardInsightsAggregates,
  MonthlyFinancialAggregates,
  CategorySpendingAggregate,
  EnvelopeLimitsAggregate,
  AccountsBalanceAggregate,
  GoalStatus,
} from '@application/contracts/daos/budget/IDashboardInsightsDao';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class DashboardInsightsDao implements IDashboardInsightsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async fetchAggregates(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<DashboardInsightsAggregates> {
    const { budgetId, periodStart, periodEnd } = params;

    const [
      monthlyFinancialResult,
      categorySpendingResult,
      envelopeLimitsResult,
      accountsBalanceResult,
      goalsResult,
    ] = await Promise.all([
      this.fetchMonthlyFinancialAggregates(budgetId, periodStart, periodEnd),
      this.fetchCategorySpending(budgetId, periodStart, periodEnd),
      this.fetchEnvelopeLimits(budgetId),
      this.fetchAccountsBalance(budgetId),
      this.fetchGoalsStatus(budgetId),
    ]);

    return {
      monthlyFinancial: monthlyFinancialResult,
      categorySpending: categorySpendingResult,
      envelopeLimits: envelopeLimitsResult,
      accountsBalance: accountsBalanceResult,
      goals: goalsResult,
    };
  }

  private async fetchMonthlyFinancialAggregates(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MonthlyFinancialAggregates> {
    const result = await this.connection.query<{
      income_month: string | null;
      expense_month: string | null;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income_month,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense_month
       FROM transactions
       WHERE budget_id = $1
         AND is_deleted = false
         AND status = 'COMPLETED'
         AND transaction_date >= $2
         AND transaction_date < $3`,
      [budgetId, periodStart, periodEnd],
    );

    const row = result?.rows[0];
    return {
      incomeMonth: row ? Number(row.income_month) : 0,
      expenseMonth: row ? Number(row.expense_month) : 0,
    };
  }

  private async fetchCategorySpending(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<CategorySpendingAggregate[]> {
    const result = await this.connection.query<{
      category_id: string;
      category_name: string;
      total_amount: string;
      transaction_count: string;
    }>(
      `SELECT
         t.category_id,
         COALESCE(c.name, 'Sem categoria') AS category_name,
         COALESCE(SUM(ABS(t.amount)), 0) AS total_amount,
         COUNT(*) AS transaction_count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.budget_id = $1
         AND t.is_deleted = false
         AND t.status = 'COMPLETED'
         AND t.type = 'EXPENSE'
         AND t.transaction_date >= $2
         AND t.transaction_date < $3
         AND t.category_id IS NOT NULL
       GROUP BY t.category_id, c.name
       ORDER BY total_amount DESC`,
      [budgetId, periodStart, periodEnd],
    );

    return (
      result?.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        totalAmount: Number(row.total_amount),
        transactionCount: Number(row.transaction_count),
      })) || []
    );
  }

  private async fetchEnvelopeLimits(
    budgetId: string,
  ): Promise<EnvelopeLimitsAggregate> {
    const result = await this.connection.query<{
      total_monthly_limit: string | null;
    }>(
      `SELECT COALESCE(SUM(monthly_limit), 0) AS total_monthly_limit
       FROM envelopes
       WHERE budget_id = $1
         AND is_deleted = false`,
      [budgetId],
    );

    const row = result?.rows[0];
    return {
      totalMonthlyLimit: row ? Number(row.total_monthly_limit) : 0,
    };
  }

  private async fetchAccountsBalance(
    budgetId: string,
  ): Promise<AccountsBalanceAggregate> {
    const result = await this.connection.query<{
      total_balance: string | null;
    }>(
      `SELECT COALESCE(SUM(balance), 0) AS total_balance
       FROM accounts
       WHERE budget_id = $1
         AND is_deleted = false`,
      [budgetId],
    );

    const row = result?.rows[0];
    return {
      totalBalance: row ? Number(row.total_balance) : 0,
    };
  }

  private async fetchGoalsStatus(budgetId: string): Promise<GoalStatus[]> {
    const result = await this.connection.query<{
      id: string;
      name: string;
      total_amount: string | number;
      accumulated_amount: string | number;
      deadline: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT
         id,
         name,
         total_amount,
         accumulated_amount,
         deadline,
         created_at,
         updated_at
       FROM goals
       WHERE budget_id = $1
         AND is_deleted = false
       ORDER BY deadline NULLS LAST, name ASC`,
      [budgetId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        targetAmount: Number(row.total_amount),
        currentAmount: Number(row.accumulated_amount),
        deadline: row.deadline ? new Date(row.deadline) : null,
        createdAt:
          row.created_at instanceof Date
            ? row.created_at
            : new Date(row.created_at),
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at
            : new Date(row.updated_at),
      })) || []
    );
  }
}
