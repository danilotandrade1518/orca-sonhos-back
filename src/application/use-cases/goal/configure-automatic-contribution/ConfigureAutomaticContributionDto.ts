import { FrequencyType } from '@domain/aggregates/goal/enums/FrequencyType';

export interface ConfigureAutomaticContributionDto {
  userId: string;
  budgetId: string;
  goalId: string;
  contributionAmount: number;
  frequencyType: FrequencyType;
  executionDay: number;
  sourceAccountId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}
