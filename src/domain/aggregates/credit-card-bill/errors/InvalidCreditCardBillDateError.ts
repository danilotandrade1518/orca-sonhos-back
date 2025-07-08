import { DomainError } from '../../../shared/DomainError';

export class InvalidCreditCardBillDateError extends DomainError {
  constructor() {
    super(
      'The credit card bill date is invalid. It must be a valid date in the past or today.',
    );
    this.name = 'InvalidCreditCardBillDateError';
  }
}
