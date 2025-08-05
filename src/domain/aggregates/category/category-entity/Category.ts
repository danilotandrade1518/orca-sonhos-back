import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { CategoryAlreadyDeletedError } from '../errors/CategoryAlreadyDeletedError';
import {
  CategoryType,
  CategoryTypeEnum,
} from '../value-objects/category-type/CategoryType';

export interface CreateCategoryDTO {
  name: string;
  type: CategoryTypeEnum;
  budgetId: string;
}

export interface UpdateCategoryDTO {
  name: string;
  type: CategoryTypeEnum;
}

export interface RestoreCategoryDTO {
  id: string;
  name: string;
  type: CategoryTypeEnum;
  budgetId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Category extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _isDeleted = false;

  private constructor(
    private _name: EntityName,
    private _type: CategoryType,
    private readonly _budgetId: EntityId,
    existingId?: EntityId,
  ) {
    super();

    this._id = existingId || EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  static create(data: CreateCategoryDTO): Either<DomainError, Category> {
    const either = new Either<DomainError, Category>();

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

  update(data: UpdateCategoryDTO): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new CategoryAlreadyDeletedError());

    const nameVo = EntityName.create(data.name);
    const typeVo = CategoryType.create(data.type);

    if (nameVo.hasError || typeVo.hasError)
      return Either.errors<DomainError, void>([
        ...nameVo.errors,
        ...typeVo.errors,
      ]);

    const nameChanged = this.name !== data.name;
    const typeChanged = this.type !== data.type;

    if (!nameChanged && !typeChanged)
      return Either.success<DomainError, void>();

    this._name = nameVo;
    this._type = typeVo;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new CategoryAlreadyDeletedError());

    this._isDeleted = true;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  static restore(data: RestoreCategoryDTO): Either<DomainError, Category> {
    const either = new Either<DomainError, Category>();

    const idVo = EntityId.fromString(data.id);
    const nameVo = EntityName.create(data.name);
    const typeVo = CategoryType.create(data.type);
    const budgetIdVo = EntityId.fromString(data.budgetId);

    if (idVo.hasError) either.addManyErrors(idVo.errors);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (typeVo.hasError) either.addManyErrors(typeVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (either.hasError) return either;

    const category = new Category(nameVo, typeVo, budgetIdVo, idVo);
    Object.defineProperty(category, '_createdAt', { value: data.createdAt });
    category._updatedAt = data.updatedAt;
    category._isDeleted = data.isDeleted;

    either.setData(category);
    return either;
  }
}
