import { ApplicationError } from './ApplicationError';

export class InsufficientPermissionsError extends ApplicationError {
  constructor() {
    super('Insufficient permissions to perform this action');
  }
}
