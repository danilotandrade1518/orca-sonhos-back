import { DomainError } from '../../../shared/DomainError';

export class ReopeningPeriodExpiredError extends DomainError {
  protected fieldName = 'creditCardBill';
  constructor() {
    super('Reopening period has expired');
  }
}
