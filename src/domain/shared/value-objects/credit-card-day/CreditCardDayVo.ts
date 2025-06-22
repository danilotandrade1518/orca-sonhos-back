import { Either } from '@either';

import { DomainError } from '../../domain-error';
import { IValueObject } from '../../value-object';
import { InvalidCreditCardDayError } from './../../errors/InvalidCreditCardDayError';

export type CreditCardDayVoValue = {
  day: number;
};

export class CreditCardDayVo implements IValueObject<CreditCardDayVoValue> {
  private either = new Either<DomainError, CreditCardDayVoValue>();

  private constructor(private _day: number) {
    this.validate();
  }

  get value(): CreditCardDayVoValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof CreditCardDayVo && vo.value?.day === this.value?.day;
  }

  static create(day: number): CreditCardDayVo {
    return new CreditCardDayVo(day);
  }

  private validate() {
    if (!Number.isInteger(this._day) || this._day < 1 || this._day > 31)
      this.either.addError(new InvalidCreditCardDayError());

    this.either.setData({ day: this._day });
  }
}
