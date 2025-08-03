import { ApplicationError } from './ApplicationError';

export class EnvelopeNotFoundError extends ApplicationError {
  constructor() {
    super('Envelope not found');
  }
}
