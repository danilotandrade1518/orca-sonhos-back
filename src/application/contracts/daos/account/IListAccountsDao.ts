export interface ListAccountsItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface IListAccountsDao {
  findByBudget(params: { budgetId: string }): Promise<ListAccountsItem[]>;
}
