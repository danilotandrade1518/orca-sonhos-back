import { DomainError } from '@domain/shared/DomainError';

export class TransferExecutionFailedError extends DomainError {
  constructor(message?: string) {
    super(message || 'Transfer execution failed');
    this.name = 'TransferExecutionFailedError';
  }
}
