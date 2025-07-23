import { ApplicationError } from './ApplicationError';

export class GoalNotFoundError extends ApplicationError {
  constructor() {
    super('Goal not found', 'goal_not_found');
  }
}
