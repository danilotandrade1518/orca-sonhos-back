import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class ListAccountsDao implements IListAccountsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findByBudget(params: {
    budgetId: string;
  }): Promise<ListAccountsItem[]> {
    const { budgetId } = params;

    const result = await this.connection.query<
      ListAccountsItem & { balance: string }
    >(
      `
      SELECT
        id,
        name,
        type,
        balance
      FROM
        accounts
      WHERE
        budget_id = $1
        AND is_deleted = false
      ORDER BY
        name ASC
      `,
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
