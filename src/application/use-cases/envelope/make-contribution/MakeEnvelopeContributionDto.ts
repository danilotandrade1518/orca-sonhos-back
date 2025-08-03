import { ContributionSource } from '@domain/aggregates/envelope/value-objects/ContributionSource';

export interface MakeEnvelopeContributionDto {
  userId: string;
  budgetId: string;
  envelopeId: string;
  amount: number;
  source: ContributionSource;
  description?: string;
  sourceAccountId?: string;
  sourceTransactionId?: string;
}
