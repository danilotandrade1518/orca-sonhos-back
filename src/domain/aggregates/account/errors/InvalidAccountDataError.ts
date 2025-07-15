import { DomainError } from '../../../shared/DomainError';

export class InvalidAccountDataError extends DomainError {
  constructor(message: string) {
    super(`Invalid account data: ${message}`);
  }
}
