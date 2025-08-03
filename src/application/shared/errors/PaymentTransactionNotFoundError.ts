import { ApplicationError } from './ApplicationError';

export class PaymentTransactionNotFoundError extends ApplicationError {
  constructor() {
    super('Payment transaction not found');
    this.name = 'PaymentTransactionNotFoundError';
  }
}
