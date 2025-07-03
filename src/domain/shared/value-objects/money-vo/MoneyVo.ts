import { Either } from '@either';

import { DomainError } from '../../domain-error';
import { InvalidMoneyError } from '../../errors/InvalidMoneyError';
import { IValueObject } from '../../value-object';

export type MoneyVoValue = {
  cents: number;
};

export class MoneyVo implements IValueObject<MoneyVoValue> {
  private either = new Either<DomainError, MoneyVoValue>();

  private constructor(private _cents: number) {
    this.validate();
  }

  get value(): MoneyVoValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof MoneyVo && vo.value?.cents === this.value?.cents;
  }

  static create(amount: number): MoneyVo {
    return new MoneyVo(amount);
  }

  get asMonetaryValue(): number {
    return (this.value?.cents ?? 0) / 100;
  }

  private validate() {
    if (typeof this._cents !== 'number' || isNaN(this._cents))
      this.either.addError(new InvalidMoneyError(this._cents));

    if (!isFinite(this._cents))
      this.either.addError(new InvalidMoneyError(this._cents));

    if (this._cents < 0)
      this.either.addError(new InvalidMoneyError(this._cents));

    this.either.setData({ cents: this._cents });
  }
}
