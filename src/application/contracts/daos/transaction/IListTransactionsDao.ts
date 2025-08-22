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
  findPageForBudget(params: {
    budgetId: string;
    offset: number;
    limit: number;
    accountId?: string;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ rows: ListTransactionsItem[]; hasNext: boolean }>;
}
