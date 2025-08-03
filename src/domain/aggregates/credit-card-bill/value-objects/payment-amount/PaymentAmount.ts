import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidPaymentAmountError } from '../../errors/InvalidPaymentAmountError';

export type PaymentAmountValue = {
  amount: number;
};

export class PaymentAmount implements IValueObject<PaymentAmountValue> {
  private either = new Either<DomainError, PaymentAmountValue>();

  private constructor(private _amount: number) {
    this.validate();
  }

  get value(): PaymentAmountValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof PaymentAmount && vo.value?.amount === this.value?.amount;
  }

  static create(amount: number): PaymentAmount {
    return new PaymentAmount(amount);
  }

  private validate() {
    if (typeof this._amount !== 'number' || isNaN(this._amount) || !isFinite(this._amount)) {
      this.either.addError(new InvalidPaymentAmountError());
      return;
    }

    if (this._amount <= 0) {
      this.either.addError(new InvalidPaymentAmountError());
    }

    if (Math.round(this._amount * 100) !== this._amount * 100) {
      this.either.addError(new InvalidPaymentAmountError());
    }

    this.either.setData({ amount: this._amount });
  }
}
