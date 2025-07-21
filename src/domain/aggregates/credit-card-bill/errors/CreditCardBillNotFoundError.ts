import { DomainError } from '../../../shared/DomainError';

export class CreditCardBillNotFoundError extends DomainError {
  protected fieldName = 'creditCardBill';

  constructor(message: string = 'Credit card bill not found') {
    super(message);
  }
}
