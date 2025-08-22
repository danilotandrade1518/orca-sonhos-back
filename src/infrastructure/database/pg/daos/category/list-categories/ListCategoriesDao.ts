import {
  IListCategoriesDao,
  ListCategoriesItem,
} from '@application/contracts/daos/category/IListCategoriesDao';

import { IPostgresConnectionAdapter } from './../../../../../adapters/IPostgresConnectionAdapter';

export class ListCategoriesDao implements IListCategoriesDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findAll(): Promise<ListCategoriesItem[]> {
    const result = await this.connection.query<ListCategoriesItem>(
      `SELECT id, name, type
       FROM categories
       WHERE is_deleted = false
       ORDER BY name ASC`
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type as 'INCOME' | 'EXPENSE',
      })) || []
    );
  }
}

