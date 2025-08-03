import { DomainError } from '../../../shared/DomainError';

export class InvalidStartDateError extends DomainError {
  constructor() {
    super('Invalid start date');
  }
}
