import { ApplicationError } from './ApplicationError';

export class DuplicateEnvelopeNameError extends ApplicationError {
  constructor() {
    super('Envelope name already exists');
  }
}
