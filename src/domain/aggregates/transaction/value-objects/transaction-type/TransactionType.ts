import { Either } from '@either';

import { DomainError } from '../../../../shared/domain-error';
import { IValueObject } from '../../../../shared/value-object';
import { InvalidTransactionTypeError } from '../../errors/InvalidTransactionTypeError';

export enum TransactionTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export type TransactionTypeValue = {
  type: TransactionTypeEnum;
};

export class TransactionType implements IValueObject<TransactionTypeValue> {
  private either = new Either<DomainError, TransactionTypeValue>();

  private constructor(private _type: TransactionTypeEnum) {
    this.validate();
  }

  get value(): TransactionTypeValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof TransactionType && vo.value?.type === this.value?.type;
  }

  static create(type: TransactionTypeEnum): TransactionType {
    return new TransactionType(type);
  }

  private validate() {
    if (
      !this._type ||
      !Object.values(TransactionTypeEnum).includes(this._type)
    ) {
      this.either.addError(new InvalidTransactionTypeError());
      return;
    }

    this.either.setData({ type: this._type });
  }
}
