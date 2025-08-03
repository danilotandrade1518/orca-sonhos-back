export interface CancelScheduledTransactionDto {
  userId: string;
  budgetId: string;
  transactionId: string;
  cancellationReason: string;
}
