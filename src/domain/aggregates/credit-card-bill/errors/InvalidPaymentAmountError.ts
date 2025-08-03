import { DomainError } from '../../../shared/DomainError';

export class InvalidPaymentAmountError extends DomainError {
  constructor() {
    super('The payment amount provided is invalid');
    this.name = 'InvalidPaymentAmountError';
  }
}
