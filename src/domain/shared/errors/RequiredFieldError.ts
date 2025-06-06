import { DomainError } from '../domain-error';

export class RequiredFieldError extends DomainError {
  constructor(field: string) {
    super(`The field '${field}' is required.`);
    this.name = 'RequiredFieldError';
  }
}
