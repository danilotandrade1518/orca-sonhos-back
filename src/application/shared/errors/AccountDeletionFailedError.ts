import { ApplicationError } from './ApplicationError';

export class AccountDeletionFailedError extends ApplicationError {
  constructor() {
    super('Failed to delete account');
  }
}
