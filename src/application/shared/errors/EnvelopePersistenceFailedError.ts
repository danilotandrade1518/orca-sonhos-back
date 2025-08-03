import { ApplicationError } from './ApplicationError';

export class EnvelopePersistenceFailedError extends ApplicationError {
  constructor() {
    super('Failed to persist envelope');
  }
}
