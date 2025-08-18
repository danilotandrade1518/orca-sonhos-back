import { IBudgetAccessRepository } from '@application/services/authorization/IBudgetAccessRepository';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

export class BudgetAccessRepository implements IBudgetAccessRepository {
  constructor(private readonly conn: IPostgresConnectionAdapter) {}

  async hasAccess(userId: string, budgetId: string): Promise<boolean> {
    const query = `SELECT 1 FROM budgets WHERE id = $1 AND is_deleted = false AND (owner_id = $2 OR $2 = ANY(participant_ids)) LIMIT 1`;
    const result = await this.conn.query(query, [budgetId, userId]);
    return !!result && result.rowCount > 0;
  }
}
