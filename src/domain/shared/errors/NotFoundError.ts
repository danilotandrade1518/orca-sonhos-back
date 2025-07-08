import { DomainError } from '../DomainError';

export class NotFoundError extends DomainError {
  constructor(fieldName: string) {
    super(`${fieldName} not found`);
    this.name = 'NotFoundError';
    this.fieldName = fieldName;
  }
}
