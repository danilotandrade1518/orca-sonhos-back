import { ApplicationError } from './ApplicationError';

export class GoalDeletionFailedError extends ApplicationError {
  constructor(message: string = 'Goal cannot be deleted') {
    super(message);
    this.name = 'GoalDeletionFailedError';
  }
}
