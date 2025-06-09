import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import {
  CategoryType,
  CategoryTypeEnum,
} from '../value-objects/category-type/CategoryType';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';

export interface CreateCategoryDTO {
  name: string;
  type: CategoryTypeEnum;
}

export class Category {
  private readonly _id: EntityId;
  private readonly _name: EntityName;
  private readonly _type: CategoryType;

  private constructor(name: EntityName, type: CategoryType) {
    this._id = EntityId.create();

    this._name = name;
    if (this._name.hasError) throw new InvalidEntityNameError(this.name);

    this._type = type;
  }

  get id(): string {
    return this._id.value?.id || '';
  }
  get name(): string {
    return this._name.value?.name || '';
  }
  get type(): CategoryTypeEnum | undefined {
    return this._type.value?.type;
  }

  static create(data: CreateCategoryDTO): Either<DomainError, Category> {
    const either = new Either<DomainError, Category>();

    const idVo = EntityId.create();
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const typeVo = CategoryType.create(data.type);
    if (typeVo.hasError) either.addManyErrors(typeVo.errors);

    if (either.hasError) return either;

    const category = new Category(nameVo, typeVo);

    either.setData(category);
    return either;
  }
}
