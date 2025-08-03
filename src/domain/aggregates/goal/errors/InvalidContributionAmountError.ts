import { DomainError } from '../../../shared/DomainError';

export class InvalidContributionAmountError extends DomainError {
  constructor() {
    super('Invalid contribution amount');
  }
}
