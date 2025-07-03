import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { IEntity } from './../../../shared/entity';

export interface CreateEnvelopeDTO {
  name: string;
  limit: number;
  categoryId: string;
}

export class Envelope implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;

  private constructor(
    private readonly _name: EntityName,
    private readonly _limit: MoneyVo,
    private readonly _categoryId: EntityId,
  ) {
    this._id = EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }
  get name(): string {
    return this._name.value?.name ?? '';
  }
  get limit(): number {
    return this._limit.value?.cents ?? 0;
  }
  get categoryId(): string {
    return this._categoryId.value?.id ?? '';
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(data: CreateEnvelopeDTO): Either<DomainError, Envelope> {
    const either = new Either<DomainError, Envelope>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const limitVo = MoneyVo.create(data.limit);
    if (limitVo.hasError) either.addManyErrors(limitVo.errors);

    const categoryIdVo = EntityId.fromString(data.categoryId);
    if (categoryIdVo.hasError) either.addManyErrors(categoryIdVo.errors);

    if (either.hasError) return either;

    const envelope = new Envelope(nameVo, limitVo, categoryIdVo);
    either.setData(envelope);
    return either;
  }
}
