import { ApplicationError } from './ApplicationError';

export class AccountUpdateFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Account update failed: ${message}`);
  }
}
