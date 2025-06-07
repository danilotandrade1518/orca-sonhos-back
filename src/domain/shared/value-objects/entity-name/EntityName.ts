import { Either } from '@either';

import { DomainError } from '../../domain-error';
import { InvalidEntityNameError } from '../../errors/InvalidEntityNameError';
import { IValueObject } from '../../value-object';

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
    if (!this._name?.trim())
      this.either.addError(new InvalidEntityNameError(this._name));

    if (this._name?.length < EntityName.MIN_LENGTH)
      this.either.addError(new InvalidEntityNameError(this._name));

    if (this._name?.length > EntityName.MAX_LENGTH)
      this.either.addError(new InvalidEntityNameError(this._name));

    this.either.setData({ name: this._name });
  }
}
