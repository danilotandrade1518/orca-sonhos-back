import { DomainError } from '../../../shared/DomainError';

export class EnvelopeAlreadyDeletedError extends DomainError {
  constructor() {
    super('Envelope is already deleted');
  }
}
