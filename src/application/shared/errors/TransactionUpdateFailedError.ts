import { ApplicationError } from './ApplicationError';

export class TransactionUpdateFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Transaction update failed: ${message}`);
  }
}
