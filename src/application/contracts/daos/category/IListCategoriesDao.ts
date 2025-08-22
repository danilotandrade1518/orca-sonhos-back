export interface ListCategoriesItem {
  id: string;
  name: string;
  type: string;
}

export interface IListCategoriesDao {
  findAll(params: {
    userId: string;
    budgetId: string;
  }): Promise<ListCategoriesItem[] | null>;
}
