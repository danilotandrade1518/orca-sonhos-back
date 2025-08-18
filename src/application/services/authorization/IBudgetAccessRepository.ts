export interface IBudgetAccessRepository {
  hasAccess(userId: string, budgetId: string): Promise<boolean>;
}
