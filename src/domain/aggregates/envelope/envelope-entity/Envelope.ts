import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { EnvelopeAlreadyDeletedError } from '../errors/EnvelopeAlreadyDeletedError';
import { EnvelopeLimitExceededError } from '../errors/EnvelopeLimitExceededError';
import { EnvelopeBalance } from '../value-objects/envelope-balance/EnvelopeBalance';
import { EnvelopeLimit } from '../value-objects/envelope-limit/EnvelopeLimit';

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
    private _currentBalance: EnvelopeBalance,
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
  get currentBalance(): number {
    return this._currentBalance.value;
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

  delete(): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    this._isDeleted = true;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  addAmount(amount: number): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const newBalanceResult = this._currentBalance.add(amount);
    if (newBalanceResult.hasError) {
      return Either.errors(newBalanceResult.errors);
    }

    const newBalance = newBalanceResult.data!;

    if (newBalance.value > this.monthlyLimit) {
      return Either.error(new EnvelopeLimitExceededError());
    }

    this._currentBalance = newBalance;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  removeAmount(amount: number): Either<DomainError, void> {
    if (this._isDeleted) {
      return Either.error(new EnvelopeAlreadyDeletedError());
    }

    const newBalanceResult = this._currentBalance.subtract(amount);
    if (newBalanceResult.hasError) {
      return Either.errors(newBalanceResult.errors);
    }

    this._currentBalance = newBalanceResult.data!;
    this._updatedAt = new Date();
    return Either.success(undefined);
  }

  getAvailableLimit(): number {
    return this.monthlyLimit - this.currentBalance;
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

    const balanceVo = EnvelopeBalance.create(0);
    if (balanceVo.hasError) {
      return Either.errors(balanceVo.errors);
    }

    const envelope = new Envelope(
      nameVo,
      limitVo.data!,
      budgetIdVo,
      categoryIdVo,
      balanceVo.data!,
    );

    return Either.success(envelope);
  }

  static restore(data: {
    id: string;
    name: string;
    monthlyLimit: number;
    budgetId: string;
    categoryId: string;
    currentBalance: number;
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

    const balanceVo = EnvelopeBalance.create(data.currentBalance);
    if (balanceVo.hasError) {
      return Either.errors(balanceVo.errors);
    }

    const envelope = new Envelope(
      nameVo,
      limitVo.data!,
      budgetIdVo,
      categoryIdVo,
      balanceVo.data!,
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
