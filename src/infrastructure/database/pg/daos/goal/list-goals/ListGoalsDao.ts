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
      due_date: string | null;
    }>(
      `SELECT id,
              name,
              total_amount,
              accumulated_amount,
              deadline::date AS due_date
         FROM goals
        WHERE budget_id = $1
          AND is_deleted = false
        ORDER BY due_date NULLS LAST, name ASC`,
      [budgetId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        targetAmount: Number(row.total_amount),
        currentAmount: Number(row.accumulated_amount),
        dueDate: row.due_date,
      })) || []
    );
  }
}
