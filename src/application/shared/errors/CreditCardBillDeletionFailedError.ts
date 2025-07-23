import { ApplicationError } from './ApplicationError';

export class CreditCardBillDeletionFailedError extends ApplicationError {
  constructor() {
    super('Failed to delete credit card bill');
  }
}
