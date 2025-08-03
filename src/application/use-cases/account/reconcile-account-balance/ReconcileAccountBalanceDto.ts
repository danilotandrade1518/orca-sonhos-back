export interface ReconcileAccountBalanceDto {
  userId: string;
  accountId: string;
  newBalance: number;
  justification: string;
}
