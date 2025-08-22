import {
  IListTransactionsDao,
  ListTransactionsItem,
} from '@application/contracts/daos/transaction/IListTransactionsDao';

import { IPostgresConnectionAdapter } from './../../../../../adapters/IPostgresConnectionAdapter';

interface TransactionRow {
  id: string;
  date: string;
  description: string | null;
  amount_cents: number;
  direction: 'IN' | 'OUT';
  account_id: string;
  category_id: string | null;
}

export class ListTransactionsDao implements IListTransactionsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async findPageForBudget(params: {
    budgetId: string;
    offset: number;
    limit: number;
    accountId?: string;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ rows: ListTransactionsItem[]; hasNext: boolean }> {
    let text = `
      SELECT id,
             occurred_on::date AS date,
             description,
             amount_cents,
             direction,
             account_id,
             category_id
      FROM transactions
      WHERE budget_id = $1
    `;
    const values: unknown[] = [params.budgetId];
    let idx = 2;

    if (params.accountId) {
      text += ` AND account_id = $${idx}`;
      values.push(params.accountId);
      idx++;
    }

    if (params.categoryId) {
      text += ` AND category_id = $${idx}`;
      values.push(params.categoryId);
      idx++;
    }

    if (params.dateFrom) {
      text += ` AND occurred_on >= $${idx}::date`;
      values.push(params.dateFrom);
      idx++;
    }

    if (params.dateTo) {
      text += ` AND occurred_on <= $${idx}::date`;
      values.push(params.dateTo);
      idx++;
    }

    text += ` ORDER BY occurred_on DESC, id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    values.push(params.limit, params.offset);

    const result = await this.connection.query<TransactionRow>(text, values);
    const dbRows = result?.rows ?? [];
    const hasNext = dbRows.length === params.limit;
    const sliceRows: TransactionRow[] = hasNext ? dbRows.slice(0, -1) : dbRows;

    const rows: ListTransactionsItem[] = sliceRows.map(
      (row: TransactionRow) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: Number(row.amount_cents),
        direction: row.direction,
        accountId: row.account_id,
        categoryId: row.category_id,
      }),
    );

    return { rows, hasNext };
  }
}
