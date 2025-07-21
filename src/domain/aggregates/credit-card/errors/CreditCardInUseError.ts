import { DomainError } from '../../../shared/DomainError';

export class CreditCardInUseError extends DomainError {
  protected fieldName = 'creditCard';

  constructor(message: string = 'Credit card has related transactions') {
    super(message);
  }
}
