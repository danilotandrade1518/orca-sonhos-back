import { DomainError } from '../../../shared/DomainError';

export class CreditCardBillAlreadyPaidError extends DomainError {
  protected fieldName = 'creditCardBill';

  constructor(message: string = 'Credit card bill is already paid') {
    super(message);
  }
}
