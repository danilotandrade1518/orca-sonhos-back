import { ApplicationError } from './ApplicationError';

export class CannotDeleteBudgetWithTransactionsError extends ApplicationError {
  constructor() {
    super('Cannot delete budget with linked transactions');
  }
}
