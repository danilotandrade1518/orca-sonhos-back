import { ApplicationError } from './ApplicationError';

export class InvalidStartDateError extends ApplicationError {
  constructor() {
    super('Invalid start date');
  }
}
