import { DomainError } from '../../../shared/DomainError';

export class CreditCardBillCannotBeUpdatedError extends DomainError {
  protected fieldName = 'creditCardBill';

  constructor(
    message: string = 'Credit card bill cannot be updated after being paid',
  ) {
    super(message);
  }
}
