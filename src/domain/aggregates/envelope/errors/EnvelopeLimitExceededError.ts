import { DomainError } from '../../../shared/DomainError';

export class EnvelopeLimitExceededError extends DomainError {
  constructor() {
    super('Envelope limit exceeded');
  }
}
