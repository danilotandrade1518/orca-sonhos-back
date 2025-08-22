export interface EnvelopeListItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

export interface IListEnvelopesDao {
  findByBudget(params: { budgetId: string }): Promise<EnvelopeListItem[]>;
}
