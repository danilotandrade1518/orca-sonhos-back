import { ApplicationError } from './ApplicationError';

export class CannotDeleteBudgetWithAccountsError extends ApplicationError {
  constructor() {
    super('Cannot delete budget with linked accounts');
  }
}
