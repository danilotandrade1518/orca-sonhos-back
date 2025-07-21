import { DomainError } from '../../../shared/DomainError';

export class CreditCardNotFoundError extends DomainError {
  protected fieldName = 'creditCard';

  constructor(message: string = 'Credit card not found') {
    super(message);
  }
}
