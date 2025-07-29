import { DomainError } from '../../../../shared/DomainError';

export class InvalidTransferAmountError extends DomainError {
  constructor() {
    super('Transfer amount must be greater than zero');
    this.name = 'InvalidTransferAmountError';
  }
}
