import { ApplicationError } from './ApplicationError';

export class GoalNotActiveError extends ApplicationError {
  constructor() {
    super('Goal is not active');
  }
}
