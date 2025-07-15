import { ApplicationError } from './ApplicationError';

export class TransactionPersistenceFailedError extends ApplicationError {
  constructor() {
    super('Failed to save transaction');
    this.name = 'TransactionPersistenceFailedError';
  }
}
