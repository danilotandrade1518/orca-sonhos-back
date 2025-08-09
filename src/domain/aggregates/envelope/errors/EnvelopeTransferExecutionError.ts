import { DomainError } from '@domain/shared/DomainError';

export class EnvelopeTransferExecutionError extends DomainError {
  protected fieldName: string = 'envelopeTransfer';

  constructor(message: string) {
    super(message);
    this.name = 'EnvelopeTransferExecutionError';
  }
}
