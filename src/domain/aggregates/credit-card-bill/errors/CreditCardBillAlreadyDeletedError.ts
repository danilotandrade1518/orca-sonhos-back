import { DomainError } from '../../../shared/DomainError';

export class CreditCardBillAlreadyDeletedError extends DomainError {
  protected fieldName = 'creditCardBill';

  constructor(message: string = 'Credit card bill is already deleted') {
    super(message);
  }
}
