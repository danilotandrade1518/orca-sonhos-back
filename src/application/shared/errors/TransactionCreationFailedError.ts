import { ApplicationError } from './ApplicationError';

export class TransactionCreationFailedError extends ApplicationError {
  constructor(reason: string) {
    super(`Transaction creation failed: ${reason}`);
    this.name = 'TransactionCreationFailedError';
  }
}
