import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { InsufficientEnvelopeBalanceError } from '../../errors/InsufficientEnvelopeBalanceError';

class InvalidEnvelopeBalanceError extends DomainError {
  constructor() {
    super('Invalid envelope balance');
  }
}

export class EnvelopeBalance {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  add(amount: number): Either<DomainError, EnvelopeBalance> {
    if (amount <= 0) {
      return Either.error(new InvalidEnvelopeBalanceError());
    }

    return Either.success(new EnvelopeBalance(this._value + amount));
  }

  subtract(amount: number): Either<DomainError, EnvelopeBalance> {
    if (amount <= 0) {
      return Either.error(new InvalidEnvelopeBalanceError());
    }

    if (amount > this._value) {
      return Either.error(new InsufficientEnvelopeBalanceError());
    }

    return Either.success(new EnvelopeBalance(this._value - amount));
  }

  static create(balance: number): Either<DomainError, EnvelopeBalance> {
    if (balance < 0) {
      return Either.error(new InvalidEnvelopeBalanceError());
    }

    return Either.success(new EnvelopeBalance(balance));
  }
}

