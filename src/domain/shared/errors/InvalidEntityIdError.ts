import { DomainError } from '../domain-error';

export class InvalidEntityIdError extends DomainError {
  constructor(uuid: string) {
    super(`The provided id '${uuid}' is invalid`);
    this.name = 'InvalidEntityIdError';
    this.fieldName = 'id';
  }
}
