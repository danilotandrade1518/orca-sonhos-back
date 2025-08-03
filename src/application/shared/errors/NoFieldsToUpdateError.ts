import { ApplicationError } from './ApplicationError';

export class NoFieldsToUpdateError extends ApplicationError {
  constructor() {
    super('No fields provided to update');
  }
}
