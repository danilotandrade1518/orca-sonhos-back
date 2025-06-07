import { Either } from '../../../shared/core/either';
import { DomainError } from '../../shared/domain-error';
import { IEntity } from '../../shared/entity';
import { EntityId } from '../../shared/value-objects/entity-id/EntityId';
import { EntityName } from './../../shared/value-objects/entity-name/EntityName';

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
  private _participantIds: EntityId[];
  // categories: Category[];
  // goals: Goal[];
  // envelopes: Envelope[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    name: EntityName,
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
    return this._name.value?.name ?? '';
  }
  get ownerId(): string {
    return this._ownerId.value?.id ?? '';
  }
  get participantIds(): string[] {
    return this._participantIds.map((id) => id.value?.id ?? '');
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  adicionarParticipante(entityId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const entityIdVo = EntityId.fromString(entityId);
    either.addManyErrors(entityIdVo.errors);

    if (either.hasError) return either;

    if (!this._participantIds.find((id) => id.equals(entityIdVo))) {
      this._participantIds.push(entityIdVo);
      this._updatedAt = new Date();
    }

    return either;
  }

  static create(data: CreateBudgetDTO): Either<DomainError, Budget> {
    const either = new Either<DomainError, Budget>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const ownerIdVo = EntityId.fromString(data.ownerId);
    if (ownerIdVo.hasError) either.addManyErrors(ownerIdVo.errors);

    const participantIds = (data.participantIds || []).map((id) =>
      EntityId.fromString(id),
    );

    participantIds
      .filter((pid) => pid.hasError)
      .forEach((pid) => either.addManyErrors(pid.errors));

    if (!participantIds.find((id) => id.equals(ownerIdVo)))
      participantIds.push(ownerIdVo);

    if (either.hasError) return either;

    const budget = new Budget(nameVo, ownerIdVo, participantIds);

    either.setData(budget);
    return either;
  }
}
