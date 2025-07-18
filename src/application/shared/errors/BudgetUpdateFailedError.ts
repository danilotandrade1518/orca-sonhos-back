import { ApplicationError } from './ApplicationError';

export class BudgetUpdateFailedError extends ApplicationError {
  constructor(message?: string) {
    super(message || 'Failed to update budget');
  }
}
