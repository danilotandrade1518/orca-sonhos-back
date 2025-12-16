import {
  EnvelopeListItem,
  IListEnvelopesDao,
} from '@application/contracts/daos/envelope/IListEnvelopesDao';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class ListEnvelopesDao implements IListEnvelopesDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findByBudget(params: {
    budgetId: string;
  }): Promise<EnvelopeListItem[]> {
    const { budgetId } = params;

    const result = await this.connection.query<{
      id: string;
      name: string;
      allocated_cents: string;
      spent_cents: string | null;
    }>(
      `SELECT e.id,
              e.name,
              e.monthly_limit AS allocated_cents,
              COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) AS spent_cents
         FROM envelopes e
         LEFT JOIN transactions t
           ON t.category_id = e.category_id
          AND t.budget_id = e.budget_id
          AND t.type = 'EXPENSE'
          AND t.is_deleted = false
        WHERE e.budget_id = $1
          AND e.is_deleted = false
        GROUP BY e.id, e.name, e.monthly_limit
        ORDER BY e.name ASC`,
      [budgetId],
    );

    return (
      result?.rows.map((row) => ({
        id: row.id,
        name: row.name,
        allocated: Number(row.allocated_cents),
        spent: Number(row.spent_cents || 0),
      })) || []
    );
  }
}
