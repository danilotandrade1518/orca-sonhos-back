import { IQueryHandler } from '../../shared/IQueryHandler';
import {
  IListCategoriesDao,
  ListCategoriesItem,
} from './../../../contracts/daos/category/IListCategoriesDao';

export interface ListCategoriesQuery {
  budgetId: string;
  userId: string;
}

export type ListCategoriesQueryResult = ListCategoriesItem[];

export class ListCategoriesQueryHandler
  implements IQueryHandler<ListCategoriesQuery, ListCategoriesQueryResult>
{
  constructor(private readonly listCategoriesDao: IListCategoriesDao) {}

  async execute(
    query: ListCategoriesQuery,
  ): Promise<ListCategoriesQueryResult> {
    const items = await this.listCategoriesDao.findAll({
      userId: query.userId,
      budgetId: query.budgetId,
    });

    return (
      items?.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
      })) || []
    );
  }
}
