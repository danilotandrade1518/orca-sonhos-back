import { ApplicationError } from './ApplicationError';

export class EnvelopeDeletionFailedError extends ApplicationError {
  constructor() {
    super('Envelope cannot be deleted');
  }
}
