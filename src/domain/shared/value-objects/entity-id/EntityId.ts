import { Either } from '../../../../shared/core/either';
import { DomainError } from '../../DomainError';
import { InvalidEntityIdError } from '../../errors/InvalidEntityIdError';
import { IValueObject } from '../../IValueObject';

export type EntityIdValue = {
  id: string;
};

export class EntityId implements IValueObject<EntityIdValue> {
  private either = new Either<DomainError, EntityIdValue>();

  private constructor(private _id: string) {
    this.validate();
  }

  get value(): EntityIdValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof EntityId && vo.value?.id === this.value?.id;
  }

  static create(): EntityId {
    const uuid = crypto.randomUUID();
    return new EntityId(uuid);
  }

  static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  private validate() {
    if (!this._id || !this.isValidUUID(this._id))
      this.either.addError(new InvalidEntityIdError(this._id));

    this.either.setData({ id: this._id });
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
