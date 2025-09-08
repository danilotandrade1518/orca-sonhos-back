import { DomainError } from '../../../shared/DomainError';

export class GoalAccountMismatchError extends DomainError {
  protected fieldName: string = 'budgetId';

  constructor(
    message = 'Goal and source account must belong to the same budget',
  ) {
    super(message);
  }
}
