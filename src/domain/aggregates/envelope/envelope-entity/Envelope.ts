import { Either } from '@either';
import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { EnvelopeLimit } from '../value-objects/envelope-limit/EnvelopeLimit';
import {
  EnvelopeStatus,
  EnvelopeStatusEnum,
} from '../value-objects/envelope-status/EnvelopeStatus';
import { EnvelopeAlreadyDeletedError } from '../errors/EnvelopeAlreadyDeletedError';

export interface CreateEnvelopeDTO {
  name: string;
  monthlyLimit: number;
  budgetId: string;
  categoryId: string;
}

export class Envelope extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _isDeleted: boolean = false;

  private constructor(
    private _name: EntityName,
    private _monthlyLimit: EnvelopeLimit,
    private readonly _budgetId: EntityId,
    private readonly _categoryId: EntityId,
    private _status: EnvelopeStatus,
    existingId?: EntityId,
  ) {
    super();
    this._id = existingId || EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }
  get name(): string {
    return this._name.value?.name ?? '';
  }
  get monthlyLimit(): number {
    return this._monthlyLimit.value;
  }
  get budgetId(): string {
    return this._budgetId.value?.id ?? '';
  }
  get categoryId(): string {
    return this._categoryId.value?.id ?? '';
  }
  get status(): EnvelopeStatusEnum {
    return this._status.value;
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

  updateName(newName: string): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const nameVo = EntityName.create(newName);
    if (nameVo.hasError) {
      return Either.errors(nameVo.errors);
    }

    if (newName === this.name) {
      return Either.success(undefined);
    }

    this._name = nameVo;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  updateLimit(newLimit: number): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const limitVo = EnvelopeLimit.create(newLimit);
    if (limitVo.hasError) {
      return Either.errors(limitVo.errors);
    }

    if (newLimit === this.monthlyLimit) {
      return Either.success(undefined);
    }

    this._monthlyLimit = limitVo.data!;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  pause(): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const pausedStatus = EnvelopeStatus.create(EnvelopeStatusEnum.PAUSED);
    this._status = pausedStatus;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  activate(): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const activeStatus = EnvelopeStatus.create(EnvelopeStatusEnum.ACTIVE);
    this._status = activeStatus;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    this._isDeleted = true;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  static create(data: CreateEnvelopeDTO): Either<DomainError, Envelope> {
    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) {
      return Either.errors(nameVo.errors);
    }

    const limitVo = EnvelopeLimit.create(data.monthlyLimit);
    if (limitVo.hasError) {
      return Either.errors(limitVo.errors);
    }

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) {
      return Either.errors(budgetIdVo.errors);
    }

    const categoryIdVo = EntityId.fromString(data.categoryId);
    if (categoryIdVo.hasError) {
      return Either.errors(categoryIdVo.errors);
    }

    const status = EnvelopeStatus.create(EnvelopeStatusEnum.ACTIVE);

    const envelope = new Envelope(
      nameVo,
      limitVo.data!,
      budgetIdVo,
      categoryIdVo,
      status,
    );

    return Either.success(envelope);
  }

  static restore(data: {
    id: string;
    name: string;
    monthlyLimit: number;
    budgetId: string;
    categoryId: string;
    status: EnvelopeStatusEnum;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Either<DomainError, Envelope> {
    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) {
      return Either.errors(nameVo.errors);
    }

    const limitVo = EnvelopeLimit.create(data.monthlyLimit);
    if (limitVo.hasError) {
      return Either.errors(limitVo.errors);
    }

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) {
      return Either.errors(budgetIdVo.errors);
    }

    const categoryIdVo = EntityId.fromString(data.categoryId);
    if (categoryIdVo.hasError) {
      return Either.errors(categoryIdVo.errors);
    }

    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError) {
      return Either.errors(idVo.errors);
    }

    const status = EnvelopeStatus.create(data.status);

    const envelope = new Envelope(
      nameVo,
      limitVo.data!,
      budgetIdVo,
      categoryIdVo,
      status,
      idVo,
    );

    Object.defineProperty(envelope, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    envelope._updatedAt = data.updatedAt;
    envelope._isDeleted = data.isDeleted;

    return Either.success(envelope);
  }
}
