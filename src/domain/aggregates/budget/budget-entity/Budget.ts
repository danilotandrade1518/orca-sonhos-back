import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { CannotRemoveOwnerFromParticipantsError } from '../../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { BudgetDeletedEvent } from '../events/BudgetDeletedEvent';
import { BudgetAlreadyDeletedError } from '../errors/BudgetAlreadyDeletedError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { BudgetParticipants } from '../budget-participants-entity/BudgetParticipants';

export interface CreateBudgetDTO {
  name: string;
  ownerId: string;
  participantIds?: string[];
}

export class Budget extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _isDeleted: boolean = false;

  private constructor(
    private readonly _name: EntityName,
    private readonly _ownerId: EntityId,
    private readonly _participants: BudgetParticipants,
  ) {
    super();

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
  get ownerId(): string {
    return this._ownerId.value?.id ?? '';
  }
  get participants(): string[] {
    return this._participants.participants;
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
    const entityIdVo = EntityId.fromString(userId);

    if (entityIdVo.hasError)
      return Either.errors<DomainError, void>(entityIdVo.errors);

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

    this.addEvent(new BudgetDeletedEvent(this.id, this.ownerId, this.name));

    either.setData(this);
    return either;
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

    const budget = new Budget(nameVo, ownerIdVo, participantsResult.data!);

    const addOwnerResult = budget.addParticipant(data.ownerId);
    if (addOwnerResult.hasError)
      return Either.errors<DomainError, Budget>(addOwnerResult.errors);

    either.setData(budget);
    return either;
  }
}
