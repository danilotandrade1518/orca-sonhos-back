import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';

export enum ParticipantRole {
  OWNER = 'OWNER',
  PARTICIPANT = 'PARTICIPANT',
}

export interface CreateBudgetParticipantDTO {
  id: string;
  role?: ParticipantRole;
}

export class BudgetParticipant implements IEntity {
  private constructor(
    private readonly _id: EntityId,
    private readonly _role: ParticipantRole,
  ) {}

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
    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError)
      return Either.errors<DomainError, BudgetParticipant>(idVo.errors);

    const participant = new BudgetParticipant(
      idVo,
      data.role ?? ParticipantRole.PARTICIPANT,
    );

    return Either.success<DomainError, BudgetParticipant>(participant);
  }
}
