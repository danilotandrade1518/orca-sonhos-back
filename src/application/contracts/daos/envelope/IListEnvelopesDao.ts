export interface EnvelopeListItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

export interface IListEnvelopesDao {
  findByBudgetForUser(params: {
    budgetId: string;
    userId: string;
  }): Promise<EnvelopeListItem[] | null>;
}
