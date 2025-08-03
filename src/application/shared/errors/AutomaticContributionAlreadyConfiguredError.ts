import { ApplicationError } from './ApplicationError';

export class AutomaticContributionAlreadyConfiguredError extends ApplicationError {
  constructor() {
    super('Automatic contribution already configured');
  }
}
