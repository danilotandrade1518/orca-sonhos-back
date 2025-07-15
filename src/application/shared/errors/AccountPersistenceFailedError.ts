import { ApplicationError } from './ApplicationError';

export class AccountPersistenceFailedError extends ApplicationError {
  constructor() {
    super('Failed to persist account');
  }
}
