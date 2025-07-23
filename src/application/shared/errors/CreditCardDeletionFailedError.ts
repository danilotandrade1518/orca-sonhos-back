import { ApplicationError } from './ApplicationError';

export class CreditCardDeletionFailedError extends ApplicationError {
  constructor(message: string = 'Credit card cannot be deleted') {
    super(message);
    this.name = 'CreditCardDeletionFailedError';
  }
}
