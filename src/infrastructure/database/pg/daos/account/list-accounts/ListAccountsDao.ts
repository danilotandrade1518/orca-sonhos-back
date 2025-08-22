import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class ListAccountsDao implements IListAccountsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findByBudgetForUser(
    budgetId: string,
    userId: string,
  ): Promise<ListAccountsItem[] | null> {
    const auth = await this.connection.query(
      `SELECT 1 FROM budgets WHERE id = $1 AND (owner_id = $2 OR $2 = ANY(participant_ids))`,
      [budgetId, userId],
    );

    if (!auth || auth.rowCount === 0) {
      return null;
    }

    const result = await this.connection.query<
      ListAccountsItem & { balance: string }
    >(
      `SELECT id, name, type, balance FROM accounts WHERE budget_id = $1 AND is_deleted = false ORDER BY name ASC`,
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
}
