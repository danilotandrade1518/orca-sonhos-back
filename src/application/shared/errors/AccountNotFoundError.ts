import { ApplicationError } from './ApplicationError';

export class AccountNotFoundError extends ApplicationError {
  constructor() {
    super('Account not found');
    this.name = 'AccountNotFoundError';
  }
}
