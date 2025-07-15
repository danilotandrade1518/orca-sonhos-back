import { ApplicationError } from './ApplicationError';

export class TransactionNotFoundError extends ApplicationError {
  constructor() {
    super('Transaction not found');
  }
}
