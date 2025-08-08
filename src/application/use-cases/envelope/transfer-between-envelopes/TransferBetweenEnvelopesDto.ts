export interface TransferBetweenEnvelopesDto {
  sourceEnvelopeId: string;
  targetEnvelopeId: string;
  userId: string;
  budgetId: string;
  amount: number;
}
