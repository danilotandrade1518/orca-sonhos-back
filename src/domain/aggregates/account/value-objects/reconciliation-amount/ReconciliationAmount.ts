import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidReconciliationAmountError } from '../../errors/InvalidReconciliationAmountError';

export type ReconciliationAmountValue = {
  amount: number;
};

export class ReconciliationAmount implements IValueObject<ReconciliationAmountValue> {
  private either = new Either<DomainError, ReconciliationAmountValue>();

  private constructor(private _amount: number) {
    this.validate();
  }

  static create(amount: number): ReconciliationAmount {
    return new ReconciliationAmount(amount);
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
    return vo instanceof ReconciliationAmount && vo.value?.amount === this.value?.amount;
  }

  private validate() {
    if (typeof this._amount !== 'number' || isNaN(this._amount) || !isFinite(this._amount)) {
      this.either.addError(new InvalidReconciliationAmountError(this._amount));
      return;
    }

    if (this._amount === 0) {
      this.either.addError(new InvalidReconciliationAmountError(this._amount));
    }

    if (Math.round(this._amount * 100) !== this._amount * 100) {
      this.either.addError(new InvalidReconciliationAmountError(this._amount));
    }

    this.either.setData({ amount: this._amount });
  }
}
