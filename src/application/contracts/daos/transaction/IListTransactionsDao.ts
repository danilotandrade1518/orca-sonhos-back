export interface ListTransactionsItem {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  direction: 'IN' | 'OUT';
  accountId: string;
  categoryId: string | null;
}

export interface IListTransactionsDao {
  findPageForBudgetUser(params: {
    budgetId: string;
    userId: string;
    offset: number;
    limit: number;
    accountId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ rows: ListTransactionsItem[]; hasNext: boolean } | null>;
}
