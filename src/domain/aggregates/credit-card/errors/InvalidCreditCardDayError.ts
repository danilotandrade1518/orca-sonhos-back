import { DomainError } from '../../../shared/domain-error';

export class InvalidCreditCardDayError extends DomainError {
  constructor() {
    super('Invalid credit card day. It must be an integer between 1 and 31.');
    this.name = 'InvalidCreditCardDayError';
  }
}
