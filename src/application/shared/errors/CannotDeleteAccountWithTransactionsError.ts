import { ApplicationError } from './ApplicationError';

export class CannotDeleteAccountWithTransactionsError extends ApplicationError {
  constructor() {
    super('Cannot delete account with existing transactions');
  }
}
