import { DomainError } from '../../../shared/DomainError';

export class EnvelopeHasBalanceError extends DomainError {
  constructor() {
    super('Envelope has balance');
  }
}
