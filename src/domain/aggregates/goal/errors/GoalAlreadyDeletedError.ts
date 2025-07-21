import { DomainError } from '../../../shared/DomainError';

export class GoalAlreadyDeletedError extends DomainError {
  protected fieldName: string = 'goal';

  constructor(message: string = 'Goal is already deleted') {
    super(message);
  }
}
