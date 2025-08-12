import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';

export interface CreateBudgetDto {
  name: string;
  ownerId: string;
  participantIds?: string[];
  type?: BudgetTypeEnum;
}
