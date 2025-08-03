import { DomainError } from '../../../shared/DomainError';

export class CreditCardBillNotPaidError extends DomainError {
  protected fieldName = 'creditCardBill';

  constructor() {
    super('Credit card bill is not paid');
  }
}
