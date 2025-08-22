/*
 * Acceptance Checklist:
 * - [ ] DAO interface created
 * - [ ] DAO implemented (global categories listing)
 * - [ ] Handler adapts output
 * - [ ] Specs passing (DAO + Handler)
 * - [ ] docs/query-view-planning.md updated row
 * - [ ] No other files changed
 * - [ ] Route NOT registered
 */

import { IQueryHandler } from '../../shared/IQueryHandler';
import {
  IListCategoriesDao,
  ListCategoriesItem,
} from './../../../contracts/daos/category/IListCategoriesDao';

export interface ListCategoriesQuery {
  userId?: string;
}

export type ListCategoriesQueryResult = ListCategoriesItem[];

export class ListCategoriesQueryHandler
  implements IQueryHandler<ListCategoriesQuery, ListCategoriesQueryResult>
{
  constructor(private readonly listCategoriesDao: IListCategoriesDao) {}

  async execute(_query: ListCategoriesQuery): Promise<ListCategoriesQueryResult> {
    const items = await this.listCategoriesDao.findAll();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
    }));
  }
}

