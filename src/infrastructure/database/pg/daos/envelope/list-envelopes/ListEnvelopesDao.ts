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
              e.allocated_cents,
              COALESCE(SUM(CASE WHEN t.direction = 'OUT' THEN ABS(t.amount_cents) ELSE 0 END), 0) AS spent_cents
         FROM envelopes e
         LEFT JOIN transactions t
           ON t.envelope_id = e.id
          AND t.budget_id = e.budget_id
          AND t.direction = 'OUT'
        WHERE e.budget_id = $1
        GROUP BY e.id, e.name, e.allocated_cents
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
