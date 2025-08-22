import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';

import { IQueryHandler } from '../../shared/IQueryHandler';

export interface ListAccountsQuery {
  budgetId: string;
  userId: string;
}

export type ListAccountsQueryResult = ListAccountsItem[];

export class ListAccountsQueryHandler
  implements IQueryHandler<ListAccountsQuery, ListAccountsQueryResult>
{
  constructor(
    private readonly listAccountsDao: IListAccountsDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(query: ListAccountsQuery): Promise<ListAccountsQueryResult> {
    const { budgetId, userId } = query;

    if (!budgetId || !userId) {
      throw new Error('INVALID_INPUT');
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      userId,
      budgetId,
    );
    if (auth.hasError) throw auth.errors[0];
    if (!auth.data) throw new InsufficientPermissionsError();

    const items = await this.listAccountsDao.findByBudget({ budgetId });

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
