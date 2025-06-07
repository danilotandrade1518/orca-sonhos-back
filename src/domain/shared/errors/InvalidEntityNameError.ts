import { DomainError } from '../domain-error';

export class InvalidEntityNameError extends DomainError {
  constructor(invalidValue: string) {
    super(`The provided name '${invalidValue}' is invalid`);
    this.name = 'InvalidEntityNameError';
    this.fieldName = 'name';
  }
}
