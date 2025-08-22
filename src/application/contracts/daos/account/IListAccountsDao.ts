export interface ListAccountsItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface IListAccountsDao {
  findByBudgetForUser(params: {
    budgetId: string;
    userId: string;
  }): Promise<ListAccountsItem[] | null>;
}
