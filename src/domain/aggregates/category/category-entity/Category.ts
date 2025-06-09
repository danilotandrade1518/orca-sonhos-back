import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import {
  CategoryType,
  CategoryTypeEnum,
} from '../value-objects/category-type/CategoryType';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';

export interface CreateCategoryDTO {
  name: string;
  type: CategoryTypeEnum;
  budgetId: string;
}

export class Category {
  private readonly _id: EntityId;
  private readonly _name: EntityName;
  private readonly _type: CategoryType;
  private readonly _budgetId: EntityId;

  private constructor(
    name: EntityName,
    type: CategoryType,
    budgetId: EntityId,
  ) {
    this._id = EntityId.create();
    this._name = name;
    if (this._name.hasError) throw new InvalidEntityNameError(this.name);

    this._type = type;
    this._budgetId = budgetId;
    if (this._budgetId.hasError) throw new InvalidEntityIdError(this.budgetId);
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
  get budgetId(): string {
    return this._budgetId.value?.id || '';
  }

  static create(data: CreateCategoryDTO): Either<DomainError, Category> {
    const either = new Either<DomainError, Category>();

    const idVo = EntityId.create();
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const typeVo = CategoryType.create(data.type);
    if (typeVo.hasError) either.addManyErrors(typeVo.errors);

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (either.hasError) return either;

    const category = new Category(nameVo, typeVo, budgetIdVo);

    either.setData(category);
    return either;
  }
}
