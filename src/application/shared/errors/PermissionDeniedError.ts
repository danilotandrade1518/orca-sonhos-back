import { ApplicationError } from './ApplicationError';

export class PermissionDeniedError extends ApplicationError {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}
