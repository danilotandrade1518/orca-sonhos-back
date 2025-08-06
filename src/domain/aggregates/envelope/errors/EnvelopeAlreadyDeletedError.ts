import { DomainError } from '../../../shared/DomainError';

export class EnvelopeAlreadyDeletedError extends DomainError {
  constructor() {
    super('Envelope já foi excluído');
  }
}
