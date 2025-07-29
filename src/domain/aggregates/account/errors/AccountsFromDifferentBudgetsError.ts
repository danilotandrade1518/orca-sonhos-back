import { DomainError } from '../../../shared/DomainError';

export class AccountsFromDifferentBudgetsError extends DomainError {
  constructor() {
    super('Accounts belong to different budgets');
  }
}
