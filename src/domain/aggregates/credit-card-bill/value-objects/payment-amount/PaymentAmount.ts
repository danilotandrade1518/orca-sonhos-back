import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { MoneyVo } from '../../../../shared/value-objects/money-vo/MoneyVo';
import { InvalidPaymentAmountError } from '../../errors/InvalidPaymentAmountError';

export type PaymentAmountValue = {
  cents: number;
};

export class PaymentAmount implements IValueObject<PaymentAmountValue> {
  private either = new Either<DomainError, PaymentAmountValue>();

  private constructor(private readonly _amount: number) {
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
    return vo instanceof PaymentAmount && vo.value?.cents === this.value?.cents;
  }

  static create(amount: number): PaymentAmount {
    return new PaymentAmount(amount);
  }

  private validate() {
    const money = MoneyVo.create(this._amount);
    if (money.hasError) this.either.addManyErrors(money.errors);

    if (this._amount <= 0) this.either.addError(new InvalidPaymentAmountError());

    if (Math.round(this._amount * 100) !== this._amount * 100)
      this.either.addError(new InvalidPaymentAmountError());

    if (!this.either.hasError) this.either.setData({ cents: money.value!.cents });
  }
}
