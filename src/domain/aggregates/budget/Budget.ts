import { Either } from '../../../shared/core/either';
import { DomainError } from '../../shared/domain-error';
import { IEntity } from '../../shared/entity';
import { RequiredFieldError } from '../../shared/errors/RequiredFieldError';
import { EntityId } from '../../shared/value-objects/entity-id/EntityId';

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
  private _name: string;
  private _ownerId: EntityId;
  private _participantIds: EntityId[];
  // categories: Category[];
  // goals: Goal[];
  // envelopes: Envelope[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    name: string,
    ownerId: EntityId,
    participantIds: EntityId[],
  ) {
    this._id = EntityId.create();
    this._name = name;
    this._ownerId = ownerId;
    this._participantIds = participantIds;
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
    return this._name;
  }
  get ownerId(): EntityId {
    return this._ownerId;
  }
  get participantIds(): EntityId[] {
    return this._participantIds;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  adicionarParticipante(EntityId: EntityId) {
    if (!this._participantIds.find((id) => id.equals(EntityId))) {
      this._participantIds.push(EntityId);
      this._updatedAt = new Date();
    }
  }

  static create(data: CreateBudgetDTO): Either<DomainError, Budget> {
    const either = new Either<DomainError, Budget>();

    if (!data.name?.trim()) either.addError(new RequiredFieldError('name'));

    const ownerId = EntityId.fromString(data.ownerId);
    if (ownerId.hasError) either.addManyErrors(ownerId.errors);

    const participantIds = (data.participantIds || []).map((id) =>
      EntityId.fromString(id),
    );
    participantIds.forEach((pid) => {
      if (pid.hasError) either.addManyErrors(pid.errors);
    });

    if (!participantIds.find((id) => id.equals(ownerId)))
      participantIds.push(ownerId);

    if (either.hasError) return either;

    const budget = new Budget(data.name, ownerId, participantIds);

    either.setData(budget);
    return either;
  }
}
