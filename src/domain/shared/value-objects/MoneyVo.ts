import { Either } from '@either';
import { DomainError } from '../domain-error';
import { InvalidMoneyError } from '../errors/InvalidMoneyError';
import { IValueObject } from '../value-object';

export type MoneyVoValue = {
  amount: number;
};

export class MoneyVo implements IValueObject<MoneyVoValue> {
  private either = new Either<DomainError, MoneyVoValue>();

  private constructor(private _amount: number) {
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
    return vo instanceof MoneyVo && vo.value?.amount === this.value?.amount;
  }

  static create(amount: number): MoneyVo {
    return new MoneyVo(amount);
  }

  private validate() {
    if (typeof this._amount !== 'number' || isNaN(this._amount)) {
      this.either.addError(
        new InvalidMoneyError('Valor deve ser um número válido'),
      );
    }
    if (!isFinite(this._amount)) {
      this.either.addError(new InvalidMoneyError('Valor deve ser finito'));
    }
    if (this._amount < 0) {
      this.either.addError(
        new InvalidMoneyError('Valor não pode ser negativo'),
      );
    }
    this.either.setData({ amount: this._amount });
  }
}
