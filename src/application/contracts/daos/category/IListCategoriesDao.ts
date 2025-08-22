export type CategoryType = 'INCOME' | 'EXPENSE';

export interface ListCategoriesItem {
  id: string;
  name: string;
  type: CategoryType;
}

export interface IListCategoriesDao {
  findAll(): Promise<ListCategoriesItem[]>;
}

