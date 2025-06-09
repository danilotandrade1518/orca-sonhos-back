import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { IEntity } from '../../../shared/entity';
import { CannotRemoveOwnerFromParticipantsError } from '../../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { BudgetParticipants } from '../budget-participants-entity/BudgetParticipants';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';

// import { Category } from './Category';
// import { Goal } from './Goal';
// import { Envelope } from './Envelope';

export interface CreateBudgetDTO {
  name: string;
  ownerId: string;
  participantIds?: string[];
}

export class Budget implements IEntity {
  private _id: EntityId;
  private _name: EntityName;
  private _ownerId: EntityId;
  private _participants: BudgetParticipants;
  // categories: Category[];
  // goals: Goal[];
  // envelopes: Envelope[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    name: EntityName,
    ownerId: EntityId,
    participants: BudgetParticipants,
  ) {
    this._id = EntityId.create();

    this._name = name;
    if (this._name.hasError) throw new InvalidEntityNameError(this.name);

    this._ownerId = ownerId;
    if (this._ownerId.hasError) throw new InvalidEntityIdError(this.ownerId);

    this._participants = participants;
    // this.categories = props.categories;
    // this.goals = props.goals;
    // this.envelopes = props.envelopes;
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

  addParticipant(userId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const entityIdVo = EntityId.fromString(userId);
    either.addManyErrors(entityIdVo.errors);

    if (either.hasError) return either;

    const result = this._participants.addParticipant(userId);
    if (result.hasError) {
      either.addManyErrors(result.errors);
      return either;
    }

    this._updatedAt = new Date();
    return either;
  }

  removeParticipant(participantId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const participantIdVo = EntityId.fromString(participantId);
    either.addManyErrors(participantIdVo.errors);

    if (either.hasError) return either;

    if (participantIdVo.equals(this._ownerId)) {
      either.addError(new CannotRemoveOwnerFromParticipantsError());
      return either;
    }

    const result = this._participants.removeParticipant(participantId);
    if (result.hasError) {
      either.addManyErrors(result.errors);
      return either;
    }

    this._updatedAt = new Date();
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

    if (participantsResult.hasError) {
      either.addManyErrors(participantsResult.errors);
      return either;
    }

    const budget = new Budget(nameVo, ownerIdVo, participantsResult.data!);

    const addOwnerResult = budget.addParticipant(data.ownerId);
    if (addOwnerResult.hasError) {
      either.addManyErrors(addOwnerResult.errors);
      return either;
    }

    either.setData(budget);
    return either;
  }
}
