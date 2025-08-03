import { DomainError } from '../../../shared/DomainError';

export class ReopeningPeriodExpiredError extends DomainError {
  protected fieldName = 'paidAt';

  constructor() {
    super('The credit card bill can only be reopened within 30 days of payment');
  }
}
