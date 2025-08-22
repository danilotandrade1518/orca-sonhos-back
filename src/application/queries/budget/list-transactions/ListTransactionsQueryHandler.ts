/*
Acceptance Checklist:
- [ ] DAO interface created
- [ ] DAO implemented with auth check + filters + pagination (LIMIT+1)
- [ ] Handler validates input, adapts output and computes hasNext from DAO result
- [ ] Specs passing (DAO + Handler)
- [ ] docs/query-view-planning.md updated row
- [ ] No other files changed
- [ ] Route NOT registered
*/

import { IQueryHandler } from '../../shared/IQueryHandler';
import {
  IListTransactionsDao,
  ListTransactionsItem,
} from '@application/contracts/daos/transaction/IListTransactionsDao';

export interface ListTransactionsQuery {
  budgetId: string;
  userId: string;
  page?: number;
  pageSize?: number;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListTransactionsQueryResult {
  items: ListTransactionsItem[];
  meta: { page: number; pageSize: number; hasNext: boolean };
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class ListTransactionsQueryHandler
  implements
    IQueryHandler<ListTransactionsQuery, ListTransactionsQueryResult>
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
      pageSize > 100 ||
      (query.dateFrom && !DATE_REGEX.test(query.dateFrom)) ||
      (query.dateTo && !DATE_REGEX.test(query.dateTo))
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

    if (!result) {
      throw new Error('NOT_FOUND');
    }

    const items = result.rows.map((row) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: row.amount,
      direction: row.direction,
      accountId: row.accountId,
      categoryId: row.categoryId,
    }));

    return {
      items,
      meta: { page, pageSize, hasNext: result.hasNext },
    };
  }
}
