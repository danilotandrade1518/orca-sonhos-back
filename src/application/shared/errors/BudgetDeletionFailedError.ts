import { ApplicationError } from './ApplicationError';

export class BudgetDeletionFailedError extends ApplicationError {
  constructor() {
    super('Failed to delete budget');
  }
}
