import { DomainError } from '../../../shared/DomainError';

export class CreditCardAlreadyDeletedError extends DomainError {
  protected fieldName = 'creditCard';

  constructor(message: string = 'Credit card is already deleted') {
    super(message);
  }
}
