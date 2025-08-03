import { ApplicationError } from './ApplicationError';

export class CreditCardBillPaymentFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Failed to pay credit card bill: ${message}`);
  }
}
