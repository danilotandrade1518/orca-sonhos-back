import { DomainError } from '../../../shared/DomainError';

export class InvalidContributionSourceError extends DomainError {
  constructor() {
    super('Invalid contribution source');
    this.name = 'InvalidContributionSourceError';
  }
}
