import { DomainError } from '../../../shared/DomainError';

export class GoalAlreadyAchievedError extends DomainError {
  protected fieldName: string = 'goal';

  constructor(message: string = 'Goal is already achieved') {
    super(message);
  }
}
