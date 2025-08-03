import { DomainError } from '../../../shared/DomainError';

export class InvalidReconciliationAmountError extends DomainError {
  constructor(value: unknown) {
    super(`Invalid reconciliation amount: ${value}`);
    this.name = 'InvalidReconciliationAmountError';
    this.fieldName = 'amount';
  }
}
