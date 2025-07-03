import { Either } from '@either';

import { DomainError } from '../../../../shared/domain-error';
import { IValueObject } from '../../../../shared/value-object';
import { InvalidCategoryTypeError } from '../../errors/InvalidCategoryTypeError';

export enum CategoryTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export type CategoryTypeValue = {
  type: CategoryTypeEnum;
};

export class CategoryType implements IValueObject<CategoryTypeValue> {
  private either = new Either<DomainError, CategoryTypeValue>();

  private constructor(private _type: CategoryTypeEnum) {
    this.validate();
  }

  get value(): CategoryTypeValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof CategoryType && vo.value?.type === this.value?.type;
  }

  static create(type: CategoryTypeEnum): CategoryType {
    return new CategoryType(type);
  }

  private validate() {
    if (!this._type) this.either.addError(new InvalidCategoryTypeError());

    this.either.setData({ type: this._type });
  }
}
