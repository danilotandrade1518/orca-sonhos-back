import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { InvalidEnvelopeLimitError } from '../../errors/InvalidEnvelopeLimitError';

export class EnvelopeLimit {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  static create(limit: number): Either<DomainError, EnvelopeLimit> {
    if (limit < 0) {
      return Either.error(new InvalidEnvelopeLimitError());
    }

    return Either.success(new EnvelopeLimit(limit));
  }
}
