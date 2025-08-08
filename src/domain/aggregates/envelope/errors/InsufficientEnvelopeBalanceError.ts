import { DomainError } from '../../../shared/DomainError';

export class InsufficientEnvelopeBalanceError extends DomainError {
  constructor() {
    super('Insufficient envelope balance');
  }
}
