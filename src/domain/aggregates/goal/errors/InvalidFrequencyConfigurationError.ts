import { DomainError } from '../../../shared/DomainError';

export class InvalidFrequencyConfigurationError extends DomainError {
  constructor() {
    super('Invalid frequency configuration');
  }
}
