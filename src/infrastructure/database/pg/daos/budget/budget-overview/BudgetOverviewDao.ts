import {
  BudgetAccount,
  BudgetCore,
  BudgetParticipant,
  IGetBudgetOverviewDao,
  MonthlyAggregates,
} from '@application/contracts/daos/budget/IGetBudgetOverviewDao';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

export class BudgetOverviewDao implements IGetBudgetOverviewDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async fetchBudgetCore(
    budgetId: string,
    userId: string,
  ): Promise<BudgetCore | null> {
    const result = await this.connection.query<BudgetCore>(
      `SELECT id, name, type
       FROM budgets
       WHERE id = $1 AND is_deleted = false
         AND (owner_id = $2 OR $2 = ANY(participant_ids))`,
      [budgetId, userId],
    );

    if (!result || result.rowCount === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'PERSONAL' | 'SHARED',
    };
  }

  async fetchParticipants(budgetId: string): Promise<BudgetParticipant[]> {
    const result = await this.connection.query<{
      owner_id: string;
      participant_ids: string[];
    }>(`SELECT owner_id, participant_ids FROM budgets WHERE id = $1`, [
      budgetId,
    ]);

    if (!result || result.rowCount === 0) return [];
    const row = result.rows[0];
    const set = new Set<string>();
    if (row.owner_id) set.add(row.owner_id);
    if (row.participant_ids) {
      for (const p of row.participant_ids) set.add(p);
    }
    return Array.from(set).map((id) => ({ id }));
  }

  async fetchAccounts(budgetId: string): Promise<BudgetAccount[]> {
    const result = await this.connection.query<
      BudgetAccount & { balance: string }
    >(
      `SELECT id, name, type, balance
       FROM accounts
       WHERE budget_id = $1 AND is_deleted = false`,
      [budgetId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        balance: Number(row.balance),
      })) || []
    );
  }

  async fetchMonthlyAggregates(
    budgetId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MonthlyAggregates> {
    const result = await this.connection.query<{
      income: string | null;
      expense: string | null;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END),0) AS income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END),0) AS expense
       FROM transactions
       WHERE budget_id = $1
         AND is_deleted = false
         AND transaction_date >= $2 AND transaction_date < $3`,
      [budgetId, periodStart, periodEnd],
    );

    const row = result?.rows[0];
    return {
      income: row ? Number(row.income) : 0,
      expense: row ? Number(row.expense) : 0,
    };
  }
}
