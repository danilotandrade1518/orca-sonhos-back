import { ApplicationError } from './ApplicationError';

export class UseCaseError extends ApplicationError {
  constructor(message: string, field: string = '', extras?: unknown) {
    super(message);
    this.name = 'UseCaseError';
    this.fieldName = field;
    this.extras = extras;
  }
}
