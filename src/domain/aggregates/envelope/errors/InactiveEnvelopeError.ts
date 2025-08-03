import { DomainError } from '../../../shared/DomainError';

export class InactiveEnvelopeError extends DomainError {
  constructor() {
    super('Envelope is not active');
    this.name = 'InactiveEnvelopeError';
  }
}
