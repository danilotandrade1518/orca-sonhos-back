import { DomainError } from '../domain-error';

export class InvalidMoneyError extends DomainError {
  constructor(invalidValue: number) {
    super(`The provided value ${invalidValue} is not a valid money amount.`);
    this.name = 'InvalidMoneyError';
  }
}
