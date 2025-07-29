import { DomainError } from '@domain/shared/DomainError';

export class TransferExecutionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TransferExecutionError';
  }
}
