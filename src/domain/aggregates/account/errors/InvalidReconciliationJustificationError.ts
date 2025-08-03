import { DomainError } from '../../../shared/DomainError';

export class InvalidReconciliationJustificationError extends DomainError {
  constructor() {
    super('Invalid reconciliation justification');
    this.name = 'InvalidReconciliationJustificationError';
    this.fieldName = 'justification';
  }
}
