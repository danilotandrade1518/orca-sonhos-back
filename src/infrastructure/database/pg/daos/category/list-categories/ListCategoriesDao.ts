import {
  IListCategoriesDao,
  ListCategoriesItem,
} from '@application/contracts/daos/category/IListCategoriesDao';

import { IPostgresConnectionAdapter } from './../../../../../adapters/IPostgresConnectionAdapter';

export class ListCategoriesDao implements IListCategoriesDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findAll(params: {
    userId: string;
    budgetId: string;
  }): Promise<ListCategoriesItem[] | null> {
    const { userId, budgetId } = params;

    const auth = await this.connection.query(
      `SELECT 1 FROM budgets WHERE id = $1 AND (owner_id = $2 OR $2 = ANY(participant_ids))`,
      [budgetId, userId],
    );

    if (!auth?.rowCount) {
      return null;
    }

    const result = await this.connection.query<ListCategoriesItem>(
      `SELECT id, name, type
       FROM categories
       WHERE budget_id = $1
         AND is_deleted = false
       ORDER BY name ASC`,
      [budgetId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
      })) || []
    );
  }
}
