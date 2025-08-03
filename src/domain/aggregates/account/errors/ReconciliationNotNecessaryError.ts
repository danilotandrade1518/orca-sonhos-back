import { DomainError } from '../../../shared/DomainError';

export class ReconciliationNotNecessaryError extends DomainError {
  constructor() {
    super('Reconciliation not necessary');
    this.name = 'ReconciliationNotNecessaryError';
  }
}
