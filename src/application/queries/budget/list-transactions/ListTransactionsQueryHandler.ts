import {
  IListTransactionsDao,
  ListTransactionsItem,
} from '@application/contracts/daos/transaction/IListTransactionsDao';

import { IQueryHandler } from '../../shared/IQueryHandler';

export interface ListTransactionsQuery {
  budgetId: string;
  userId: string;
  page?: number;
  pageSize?: number;
  accountId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListTransactionsQueryResult {
  items: ListTransactionsItem[];
  meta: { page: number; pageSize: number; hasNext: boolean };
}

export class ListTransactionsQueryHandler
  implements IQueryHandler<ListTransactionsQuery, ListTransactionsQueryResult>
{
  constructor(private readonly dao: IListTransactionsDao) {}

  async execute(
    query: ListTransactionsQuery,
  ): Promise<ListTransactionsQueryResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    if (
      !query.budgetId ||
      !query.userId ||
      page < 1 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new Error('INVALID_INPUT');
    }

    const offset = (page - 1) * pageSize;
    const limit = pageSize + 1;

    const result = await this.dao.findPageForBudgetUser({
      budgetId: query.budgetId,
      userId: query.userId,
      offset,
      limit,
      accountId: query.accountId,
      categoryId: query.categoryId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    const items =
      result?.rows.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: row.amount,
        direction: row.direction,
        accountId: row.accountId,
        categoryId: row.categoryId,
      })) || [];

    return {
      items,
      meta: { page, pageSize, hasNext: result?.hasNext || false },
    };
  }
}
