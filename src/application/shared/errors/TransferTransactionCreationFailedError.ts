import { ApplicationError } from './ApplicationError';

export class TransferTransactionCreationFailedError extends ApplicationError {
  constructor(reason: string) {
    super(`Transfer transaction creation failed: ${reason}`);
  }
}
