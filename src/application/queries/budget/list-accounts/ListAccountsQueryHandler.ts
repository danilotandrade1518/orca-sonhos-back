import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';

import { IQueryHandler } from '../../shared/IQueryHandler';

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

    const items = await this.listAccountsDao.findByBudgetForUser({
      budgetId,
      userId,
    });

    return (
      items?.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        balance: item.balance,
      })) || []
    );
  }
}
