import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { IEntity } from '../../../shared/entity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';

export enum ParticipantRole {
  OWNER = 'OWNER',
  PARTICIPANT = 'PARTICIPANT',
}

export interface CreateBudgetParticipantDTO {
  id: string;
  role?: ParticipantRole;
}

export class BudgetParticipant implements IEntity {
  private _id: EntityId;
  private _role: ParticipantRole;

  private constructor(id: EntityId, role: ParticipantRole) {
    this._id = id;
    if (this._id.hasError)
      throw new InvalidEntityIdError(this._id.value?.id ?? '');

    this._role = role;
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }

  get role(): ParticipantRole {
    return this._role;
  }

  isOwner(): boolean {
    return this._role === ParticipantRole.OWNER;
  }

  static create(
    data: CreateBudgetParticipantDTO,
  ): Either<DomainError, BudgetParticipant> {
    const either = new Either<DomainError, BudgetParticipant>();

    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    if (either.hasError) return either;

    const participant = new BudgetParticipant(
      idVo,
      data.role ?? ParticipantRole.PARTICIPANT,
    );

    either.setData(participant);
    return either;
  }
}
