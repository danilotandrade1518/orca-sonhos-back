import { ApplicationError } from './ApplicationError';

export class SourceAccountRequiredError extends ApplicationError {
  constructor() {
    super('Source account required');
  }
}
