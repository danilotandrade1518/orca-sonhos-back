import { DomainError } from '../../../shared/domain-error';

export class InvalidAccountTypeError extends DomainError {
  constructor() {
    super('O tipo de conta informado é inválido.');
  }
}
