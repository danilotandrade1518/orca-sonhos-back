import { ApplicationError } from './ApplicationError';

export class CreditCardBillNotFoundError extends ApplicationError {
  constructor() {
    super('Credit card bill not found');
  }
}
