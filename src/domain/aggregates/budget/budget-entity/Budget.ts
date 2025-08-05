import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { CannotRemoveOwnerFromParticipantsError } from '../../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { BudgetParticipants } from '../budget-participants-entity/BudgetParticipants';
import { BudgetAlreadyDeletedError } from '../errors/BudgetAlreadyDeletedError';
import { BudgetNotSharedError } from '../errors/BudgetNotSharedError';
import { ParticipantAlreadyExistsError } from '../errors/ParticipantAlreadyExistsError';
import {
  BudgetType,
  BudgetTypeEnum,
} from '../value-objects/budget-type/BudgetType';

export interface CreateBudgetDTO {
  name: string;
  ownerId: string;
  participantIds?: string[];
  type?: BudgetTypeEnum;
}

export class Budget extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _isDeleted: boolean = false;

  private constructor(
    private _name: EntityName,
    private readonly _ownerId: EntityId,
    private readonly _participants: BudgetParticipants,
    private readonly _type: BudgetType,
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
  get ownerId(): string {
    return this._ownerId.value?.id ?? '';
  }
  get participants(): string[] {
    return this._participants.participants;
  }
  get type(): BudgetType {
    return this._type;
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

  isParticipant(userId: string): boolean {
    if (this.ownerId === userId) {
      return true;
    }

    return this.participants.includes(userId);
  }

  addParticipant(userId: string): Either<DomainError, void> {
    if (!this._type.isShared()) {
      return Either.error<DomainError, void>(new BudgetNotSharedError());
    }

    const entityIdVo = EntityId.fromString(userId);
    if (entityIdVo.hasError)
      return Either.errors<DomainError, void>(entityIdVo.errors);

    if (this.isParticipant(userId)) {
      return Either.error<DomainError, void>(
        new ParticipantAlreadyExistsError(userId),
      );
    }

    const result = this._participants.addParticipant(userId);
    if (result.hasError) return Either.errors<DomainError, void>(result.errors);

    this._updatedAt = new Date();
    return Either.success<DomainError, void>();
  }

  removeParticipant(participantId: string): Either<DomainError, void> {
    const participantIdVo = EntityId.fromString(participantId);

    if (participantIdVo.hasError)
      return Either.errors<DomainError, void>(participantIdVo.errors);

    if (participantIdVo.equals(this._ownerId))
      return Either.error<DomainError, void>(
        new CannotRemoveOwnerFromParticipantsError(),
      );

    const result = this._participants.removeParticipant(participantId);
    if (result.hasError) return Either.errors<DomainError, void>(result.errors);

    this._updatedAt = new Date();
    return Either.success<DomainError, void>();
  }

  delete(): Either<DomainError, Budget> {
    const either = new Either<DomainError, Budget>();

    if (this._isDeleted) {
      either.addError(new BudgetAlreadyDeletedError());
      return either;
    }

    this._isDeleted = true;
    this._updatedAt = new Date();

    either.setData(this);
    return either;
  }

  update(data: { name?: string }): Either<DomainError, void> {
    const newName = data.name ?? this.name;
    const nameVo = EntityName.create(newName);
    if (nameVo.hasError) return Either.errors<DomainError, void>(nameVo.errors);

    if (newName === this.name) return Either.success<DomainError, void>();

    this._name = nameVo;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  static create(data: CreateBudgetDTO): Either<DomainError, Budget> {
    const either = new Either<DomainError, Budget>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const ownerIdVo = EntityId.fromString(data.ownerId);
    if (ownerIdVo.hasError) either.addManyErrors(ownerIdVo.errors);

    if (either.hasError) return either;

    const participantsResult = BudgetParticipants.create({
      participantIds: data.participantIds || [],
    });

    if (participantsResult.hasError)
      return Either.errors<DomainError, Budget>(participantsResult.errors);

    const hasParticipants =
      data.participantIds && data.participantIds.length > 0;
    const budgetType = BudgetType.create(
      data.type ||
        (hasParticipants ? BudgetTypeEnum.SHARED : BudgetTypeEnum.PERSONAL),
    );

    const budget = new Budget(
      nameVo,
      ownerIdVo,
      participantsResult.data!,
      budgetType,
    );

    const addOwnerResult = budget._participants.addParticipant(data.ownerId);
    if (addOwnerResult.hasError)
      return Either.errors<DomainError, Budget>(addOwnerResult.errors);

    either.setData(budget);
    return either;
  }

  static restore(data: {
    id: string;
    name: string;
    ownerId: string;
    participantIds: string[];
    type?: BudgetTypeEnum;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }): Either<DomainError, Budget> {
    const either = new Either<DomainError, Budget>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const ownerIdVo = EntityId.fromString(data.ownerId);
    if (ownerIdVo.hasError) either.addManyErrors(ownerIdVo.errors);

    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    if (either.hasError) return either;

    const participantsResult = BudgetParticipants.create({
      participantIds: data.participantIds,
    });

    if (participantsResult.hasError)
      return Either.errors<DomainError, Budget>(participantsResult.errors);

    const budgetType = BudgetType.create(data.type || BudgetTypeEnum.PERSONAL);

    const budget = new Budget(
      nameVo,
      ownerIdVo,
      participantsResult.data!,
      budgetType,
      idVo,
    );

    Object.defineProperty(budget, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    budget._updatedAt = data.updatedAt;
    budget._isDeleted = data.isDeleted;

    either.setData(budget);
    return either;
  }
}
