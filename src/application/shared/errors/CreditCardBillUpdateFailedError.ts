import { ApplicationError } from './ApplicationError';

export class CreditCardBillUpdateFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Failed to update credit card bill: ${message}`);
  }
}
