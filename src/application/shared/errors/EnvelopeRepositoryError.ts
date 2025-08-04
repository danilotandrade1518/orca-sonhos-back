import { ApplicationError } from './ApplicationError';

export class EnvelopeRepositoryError extends ApplicationError {
  constructor() {
    super('Failed to access envelope repository');
  }
}
