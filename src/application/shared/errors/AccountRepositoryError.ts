import { ApplicationError } from './ApplicationError';

export class AccountRepositoryError extends ApplicationError {
  constructor() {
    super('Failed to find account');
    this.name = 'AccountRepositoryError';
  }
}
