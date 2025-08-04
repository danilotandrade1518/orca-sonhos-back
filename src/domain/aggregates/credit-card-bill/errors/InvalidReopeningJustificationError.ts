import { DomainError } from '../../../shared/DomainError';

export class InvalidReopeningJustificationError extends DomainError {
  constructor() {
    super('Justification must be between 10 and 500 characters');
    this.name = 'InvalidReopeningJustificationError';
    this.fieldName = 'justification';
  }
}
