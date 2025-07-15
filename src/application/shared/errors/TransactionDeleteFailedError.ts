import { ApplicationError } from './ApplicationError';

export class TransactionDeleteFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Transaction delete failed: ${message}`);
  }
}
