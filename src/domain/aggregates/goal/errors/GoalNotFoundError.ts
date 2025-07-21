import { DomainError } from '../../../shared/DomainError';

export class GoalNotFoundError extends DomainError {
  protected fieldName: string = 'goal';

  constructor(message: string = 'Goal not found') {
    super(message);
  }
}
