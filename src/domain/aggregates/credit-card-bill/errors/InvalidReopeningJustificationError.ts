import { DomainError } from '../../../shared/DomainError';

export class InvalidReopeningJustificationError extends DomainError {
  protected fieldName = 'justification';

  constructor() {
    super('Reopening justification must be between 10 and 500 characters');
  }
}
