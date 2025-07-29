import { DomainError } from '../../../shared/DomainError';

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super('Insufficient balance to perform the operation');
    this.name = 'InsufficientBalanceError';
  }
}
