import { IQueryHandler } from '../../shared/IQueryHandler';
import { IListBudgetsDao } from './../../../contracts/daos/budget/IListBudgetsDao';

export interface ListBudgetsQuery {
  userId: string;
  includeDeleted?: boolean;
}

export interface ListBudgetsQueryResult {
  id: string;
  name: string;
  type: string;
  participantsCount: number;
}

export class ListBudgetsQueryHandler
  implements IQueryHandler<ListBudgetsQuery, ListBudgetsQueryResult[]>
{
  constructor(private readonly listBudgetsDao: IListBudgetsDao) {}

  async execute(query: ListBudgetsQuery): Promise<ListBudgetsQueryResult[]> {
    const items = await this.listBudgetsDao.findByUser({
      userId: query.userId,
      includeDeleted: query.includeDeleted,
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      participantsCount: item.participantsCount,
    }));
  }
}
