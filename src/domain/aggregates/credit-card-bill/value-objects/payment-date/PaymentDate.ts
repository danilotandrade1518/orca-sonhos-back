import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidPaymentDateError } from '../../errors/InvalidPaymentDateError';

export type PaymentDateValue = {
  date: Date;
};

export class PaymentDate implements IValueObject<PaymentDateValue> {
  private either = new Either<DomainError, PaymentDateValue>();

  private constructor(private _date: Date, private readonly _minDate: Date) {
    this.validate();
  }

  get value(): PaymentDateValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof PaymentDate && vo.value?.date.getTime() === this.value?.date.getTime();
  }

  static create(date: Date, minDate: Date): PaymentDate {
    return new PaymentDate(date, minDate);
  }

  private validate() {
    if (!(this._date instanceof Date) || isNaN(this._date.getTime())) {
      this.either.addError(new InvalidPaymentDateError());
      return;
    }

    const now = new Date();
    if (this._date.getTime() > now.getTime()) {
      this.either.addError(new InvalidPaymentDateError());
    }

    if (this._date.getTime() < this._minDate.getTime()) {
      this.either.addError(new InvalidPaymentDateError());
    }

    this.either.setData({ date: this._date });
  }
}
