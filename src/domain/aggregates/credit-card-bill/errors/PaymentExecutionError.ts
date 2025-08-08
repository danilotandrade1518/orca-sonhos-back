import { DomainError } from '../../../shared/DomainError';

export class PaymentExecutionError extends DomainError {
  protected fieldName = 'creditCardBillPayment';

  constructor(message: string = 'Failed to execute credit card bill payment') {
    super(message);
    this.name = 'PaymentExecutionError';
  }
}
