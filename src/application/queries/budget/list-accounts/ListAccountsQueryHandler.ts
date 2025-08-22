/*
- [ ] DAO interface created
- [ ] DAO implemented with auth check + listing
- [ ] Handler validates input and adapts output
- [ ] Specs passing (DAO + Handler)
- [ ] docs/query-view-planning.md updated row
- [ ] No other files changed
- [ ] Route NOT registered
*/

import { IQueryHandler } from '../../shared/IQueryHandler';
import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';

export interface ListAccountsQuery {
  budgetId: string;
  userId: string;
}

export type ListAccountsQueryResult = ListAccountsItem[];

export class ListAccountsQueryHandler
  implements IQueryHandler<ListAccountsQuery, ListAccountsQueryResult>
{
  constructor(private readonly listAccountsDao: IListAccountsDao) {}

  async execute(query: ListAccountsQuery): Promise<ListAccountsQueryResult> {
    const { budgetId, userId } = query;

    if (!budgetId || !userId) {
      throw new Error('INVALID_INPUT');
    }

    const items = await this.listAccountsDao.findByBudgetForUser(
      budgetId,
      userId,
    );

    if (items === null) {
      throw new Error('NOT_FOUND');
    }

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      balance: item.balance,
    }));
  }
}
