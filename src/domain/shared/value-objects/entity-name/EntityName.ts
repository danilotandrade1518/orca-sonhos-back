import { Either } from '@either';

import { DomainError } from '../../DomainError';
import { InvalidEntityNameError } from '../../errors/InvalidEntityNameError';
import { IValueObject } from '../../IValueObject';

export type EntityNameValue = {
  name: string;
};

export class EntityName implements IValueObject<EntityNameValue> {
  private either = new Either<DomainError, EntityNameValue>();

  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 50;

  private constructor(private _name: string) {
    this.validate();
  }

  get value(): EntityNameValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof EntityName && vo.value?.name === this.value?.name;
  }

  static create(name: string): EntityName {
    return new EntityName(name);
  }

  private validate() {
    const trimedName = this._name?.trim();

    if (!trimedName)
      this.either.addError(new InvalidEntityNameError(this._name));

    if (trimedName && trimedName.length < EntityName.MIN_LENGTH)
      this.either.addError(new InvalidEntityNameError(this._name));

    if (trimedName && trimedName.length > EntityName.MAX_LENGTH)
      this.either.addError(new InvalidEntityNameError(this._name));

    this.either.setData({ name: this._name });
  }
}
