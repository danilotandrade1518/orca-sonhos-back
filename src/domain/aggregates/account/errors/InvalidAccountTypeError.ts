import { DomainError } from '../../../shared/DomainError';

export class InvalidAccountTypeError extends DomainError {
  constructor() {
    super('O tipo de conta informado é inválido.');
  }
}
