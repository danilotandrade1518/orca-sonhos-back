import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidCancellationReasonError } from '../../errors/InvalidCancellationReasonError';

export type CancellationReasonValue = {
  reason: string;
};

export class CancellationReason
  implements IValueObject<CancellationReasonValue>
{
  private either = new Either<DomainError, CancellationReasonValue>();

  private constructor(private _reason: string) {
    this.validate();
  }

  get value(): CancellationReasonValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return (
      vo instanceof CancellationReason &&
      vo.value?.reason === this.value?.reason
    );
  }

  static create(reason: string): CancellationReason {
    return new CancellationReason(reason);
  }

  private validate() {
    const trimmed = (this._reason ?? '').trim();

    if (!trimmed || trimmed.length < 3 || trimmed.length > 255)
      this.either.addError(new InvalidCancellationReasonError());

    this.either.setData({ reason: trimmed });
  }
}
