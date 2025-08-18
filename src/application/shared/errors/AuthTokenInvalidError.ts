import { ApplicationError } from './ApplicationError';

export class AuthTokenInvalidError extends ApplicationError {
  constructor(message: string = 'Invalid authentication token') {
    super(message);
    this.name = 'AuthTokenInvalidError';
  }
  get errorObj() {
    return { error: 'Unauthorized', field: '', message: this.message };
  }
}
