import { DomainError } from '../DomainError';

export class RequiredFieldError extends DomainError {
  constructor(field: string) {
    super(`The field '${field}' is required.`);
    this.fieldName = field;
    this.name = 'RequiredFieldError';
  }
}
