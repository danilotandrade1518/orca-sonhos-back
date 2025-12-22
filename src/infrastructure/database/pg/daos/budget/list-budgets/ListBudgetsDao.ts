import {
  BudgetListItem,
  IListBudgetsDao,
} from '@application/contracts/daos/budget/IListBudgetsDao';

import { IPostgresConnectionAdapter } from './../../../../../adapters/IPostgresConnectionAdapter';

export class ListBudgetsDao implements IListBudgetsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findByUser(params: { userId: string }): Promise<BudgetListItem[]> {
    const { userId } = params;

    const result = await this.connection.query<
      BudgetListItem & { participantscount: string }
    >(
      `SELECT b.id, b.name, b.type, COUNT(DISTINCT bp.participant_id) as participantsCount
       FROM budgets b
       LEFT JOIN budget_participants bp ON bp.budget_id = b.id
       WHERE b.owner_id = $1 
          OR bp.participant_id = $1
       GROUP BY b.id, b.name, b.type`,
      [userId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        participantsCount: Number(row.participantscount),
      })) || []
    );
  }
}
