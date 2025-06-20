import { DomainError } from '../domain-error';

export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}
