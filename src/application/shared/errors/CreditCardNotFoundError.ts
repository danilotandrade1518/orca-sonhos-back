import { ApplicationError } from './ApplicationError';

export class CreditCardNotFoundError extends ApplicationError {
  constructor(message: string = 'Credit card not found') {
    super(message);
    this.name = 'CreditCardNotFoundError';
  }
}
