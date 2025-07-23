import { ApplicationError } from './ApplicationError';

export class CreditCardBillCreationFailedError extends ApplicationError {
  constructor(message: string) {
    super(`Failed to create credit card bill: ${message}`);
  }
}
