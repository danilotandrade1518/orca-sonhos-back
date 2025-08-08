import { DomainError } from '../../../shared/DomainError';

export class ReconciliationExecutionError extends DomainError {
  protected fieldName = 'accountReconciliation';

  constructor(message: string = 'Failed to execute account reconciliation') {
    super(message);
    this.name = 'ReconciliationExecutionError';
  }
}
