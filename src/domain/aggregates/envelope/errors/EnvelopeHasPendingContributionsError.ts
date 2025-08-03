import { DomainError } from '../../../shared/DomainError';

export class EnvelopeHasPendingContributionsError extends DomainError {
  constructor() {
    super('Envelope has pending contributions');
  }
}
