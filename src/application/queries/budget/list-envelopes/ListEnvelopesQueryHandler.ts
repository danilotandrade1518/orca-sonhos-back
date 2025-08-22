import { IListEnvelopesDao } from '../../../contracts/daos/envelope/IListEnvelopesDao';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { IQueryHandler } from '../../shared/IQueryHandler';

export interface ListEnvelopesQuery {
  budgetId: string;
  userId: string;
}

export interface ListEnvelopesItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export type ListEnvelopesQueryResult = ListEnvelopesItem[];

export class ListEnvelopesQueryHandler
  implements IQueryHandler<ListEnvelopesQuery, ListEnvelopesQueryResult>
{
  constructor(
    private readonly listEnvelopesDao: IListEnvelopesDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(query: ListEnvelopesQuery): Promise<ListEnvelopesQueryResult> {
    if (!query.budgetId || !query.userId) {
      throw new Error('INVALID_INPUT');
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      query.userId,
      query.budgetId,
    );
    if (auth.hasError) throw auth.errors[0];
    if (!auth.data) throw new InsufficientPermissionsError();

    const items = await this.listEnvelopesDao.findByBudget({
      budgetId: query.budgetId,
    });

    return (
      items?.map((item) => {
        const remaining = item.allocated - item.spent;
        const percentUsed =
          item.allocated === 0 ? 0 : item.spent / item.allocated;

        return {
          id: item.id,
          name: item.name,
          allocated: item.allocated,
          spent: item.spent,
          remaining,
          percentUsed,
        };
      }) || []
    );
  }
}
