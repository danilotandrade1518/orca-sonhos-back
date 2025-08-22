import { IListEnvelopesDao } from '../../../contracts/daos/envelope/IListEnvelopesDao';
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
  constructor(private readonly listEnvelopesDao: IListEnvelopesDao) {}

  async execute(query: ListEnvelopesQuery): Promise<ListEnvelopesQueryResult> {
    if (!query.budgetId || !query.userId) {
      throw new Error('INVALID_INPUT');
    }

    const items = await this.listEnvelopesDao.findByBudgetForUser({
      budgetId: query.budgetId,
      userId: query.userId,
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
