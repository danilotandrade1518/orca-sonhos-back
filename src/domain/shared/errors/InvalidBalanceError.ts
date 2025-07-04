import { DomainError } from '../domain-error';

export class InvalidBalanceError extends DomainError {
  constructor(value: unknown) {
    super(`O valor do saldo informado é inválido: ${value}`);
  }
}
