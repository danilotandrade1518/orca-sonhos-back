import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidReconciliationAmountError } from '../../errors/InvalidReconciliationAmountError';

export type ReconciliationAmountValue = {
  cents: number;
};

export class ReconciliationAmount implements IValueObject<ReconciliationAmountValue> {
  private either = new Either<DomainError, ReconciliationAmountValue>();

  private constructor(private _cents: number) {
    this.validate();
  }

  get value(): ReconciliationAmountValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof ReconciliationAmount && vo.value?.cents === this.value?.cents;
  }

  static create(amount: number): ReconciliationAmount {
    return new ReconciliationAmount(amount);
  }

  get asMonetaryValue(): number {
    return (this.value?.cents ?? 0) / 100;
  }

  private validate() {
    if (typeof this._cents !== 'number' || isNaN(this._cents) || !isFinite(this._cents)) {
      this.either.addError(new InvalidReconciliationAmountError(this._cents));
    }

    if (this._cents === 0) {
      this.either.addError(new InvalidReconciliationAmountError(this._cents));
    }

    if (!Number.isInteger(this._cents)) {
      this.either.addError(new InvalidReconciliationAmountError(this._cents));
    }

    this.either.setData({ cents: this._cents });
  }
}
