export interface UpdateEnvelopeDto {
  envelopeId: string;
  userId: string;
  budgetId: string;
  name?: string;
  monthlyLimit?: number;
}
