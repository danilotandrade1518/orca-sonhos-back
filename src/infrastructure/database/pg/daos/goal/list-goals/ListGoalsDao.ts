import {
  GoalListItem,
  IListGoalsDao,
} from '@application/contracts/daos/goal/IListGoalsDao';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class ListGoalsDao implements IListGoalsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findByBudget(params: { budgetId: string }): Promise<GoalListItem[]> {
    const { budgetId } = params;

    const result = await this.connection.query<{
      id: string;
      name: string;
      total_amount: number | string;
      accumulated_amount: number | string;
      deadline: string | null;
      budget_id: string;
      source_account_id: string | null;
    }>(
      `SELECT id,
              name,
              total_amount,
              accumulated_amount,
              deadline,
              budget_id,
              source_account_id
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
        totalAmount: Number(row.total_amount) || 0,
        accumulatedAmount: Number(row.accumulated_amount) || 0,
        deadline: row.deadline,
        budgetId: row.budget_id,
        sourceAccountId: row.source_account_id || undefined,
      })) || []
    );
  }
}
