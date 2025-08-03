import { DomainError } from '../../../shared/DomainError';

export class InvalidReconciliationJustificationError extends DomainError {
  constructor(value: string) {
    super(`Invalid reconciliation justification: ${value}`);
  }
}
