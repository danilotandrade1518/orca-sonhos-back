import { DomainError } from '../../../shared/DomainError';

export class SameAccountTransferError extends DomainError {
  constructor() {
    super('Cannot transfer to the same account');
  }
}
