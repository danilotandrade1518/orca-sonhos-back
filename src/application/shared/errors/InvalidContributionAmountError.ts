import { ApplicationError } from './ApplicationError';

export class InvalidContributionAmountError extends ApplicationError {
  constructor() {
    super('Invalid contribution amount');
  }
}
