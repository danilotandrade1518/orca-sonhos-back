import { DomainError } from '../../../shared/DomainError';

export class InvalidEnvelopeLimitError extends DomainError {
  constructor() {
    super('Invalid envelope limit');
    this.name = 'InvalidEnvelopeLimitError';
  }
}
