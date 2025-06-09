import { DomainError } from '../domain-error';

export class NotFoundError extends DomainError {
  constructor(fieldName: string) {
    super(`${fieldName} not found`);
    this.name = 'NotFoundError';
    this.fieldName = fieldName;
  }
}
