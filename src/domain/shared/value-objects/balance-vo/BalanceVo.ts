import { Either } from '@either';

import { DomainError } from '../../DomainError';
import { IValueObject } from '../../IValueObject';
import { InvalidBalanceError } from './../../errors/InvalidBalanceError';

export type BalanceVoValue = {
  cents: number;
};

export class BalanceVo implements IValueObject<BalanceVoValue> {
  private either = new Either<DomainError, BalanceVoValue>();

  private constructor(private _cents: number) {
    this.validate();
  }

  get value(): BalanceVoValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof BalanceVo && vo.value?.cents === this.value?.cents;
  }

  static create(amount: number): BalanceVo {
    return new BalanceVo(amount);
  }

  get asMonetaryValue(): number {
    return (this.value?.cents ?? 0) / 100;
  }

  private validate() {
    if (
      typeof this._cents !== 'number' ||
      isNaN(this._cents) ||
      !isFinite(this._cents)
    )
      this.either.addError(new InvalidBalanceError(this._cents));

    this.either.setData({ cents: this._cents });
  }
}
