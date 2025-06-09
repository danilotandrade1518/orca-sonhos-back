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

  private constructor(private _type: string) {
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

  static create(type: string): CategoryType {
    return new CategoryType(type);
  }

  private validate() {
    if (!this._type?.trim())
      this.either.addError(new InvalidCategoryTypeError());

    const validType = Object.values(CategoryTypeEnum).find(
      (t) => t === this._type.toUpperCase(),
    );
    if (!validType) this.either.addError(new InvalidCategoryTypeError());

    if (validType) this.either.setData({ type: validType });
  }
}
