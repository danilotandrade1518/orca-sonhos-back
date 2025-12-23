import { ApplicationError } from './ApplicationError';

export class InsufficientPermissionsError extends ApplicationError {
  constructor() {
    super('Insufficient permissions');
    this.name = 'InsufficientPermissionsError';
  }
}
