import { DomainError } from '../../../shared/DomainError';

export class EnvelopeHasTransactionsError extends DomainError {
  constructor() {
    super('Envelope has transactions');
  }
}
