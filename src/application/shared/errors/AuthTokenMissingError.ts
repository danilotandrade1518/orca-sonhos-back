import { ApplicationError } from './ApplicationError';

export class AuthTokenMissingError extends ApplicationError {
  constructor() {
    super('Authentication token missing');
    this.name = 'AuthTokenMissingError';
  }
  get errorObj() {
    return { error: 'Unauthorized', field: '', message: this.message };
  }
}
