import { DomainError } from '../../../shared/DomainError';

export class AutomaticContributionAlreadyConfiguredError extends DomainError {
  constructor() {
    super('Automatic contribution already configured');
  }
}
