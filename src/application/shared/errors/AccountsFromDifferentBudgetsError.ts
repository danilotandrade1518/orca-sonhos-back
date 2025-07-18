import { ApplicationError } from './ApplicationError';

export class AccountsFromDifferentBudgetsError extends ApplicationError {
  constructor() {
    super('Accounts belong to different budgets');
  }
}
