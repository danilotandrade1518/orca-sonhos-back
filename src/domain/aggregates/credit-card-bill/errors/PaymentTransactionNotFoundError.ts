import { DomainError } from '../../../shared/DomainError';

export class PaymentTransactionNotFoundError extends DomainError {
  protected fieldName = 'transaction';

  constructor() {
    super('Payment transaction not found');
  }
}
