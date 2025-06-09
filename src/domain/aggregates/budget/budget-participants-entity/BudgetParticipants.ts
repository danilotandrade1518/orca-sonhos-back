import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { IEntity } from '../../../shared/entity';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { BudgetParticipant } from '../budget-participant-entity/BudgetParticipant';

export interface CreateBudgetParticipantsDTO {
  participantIds: string[];
}

export class BudgetParticipants implements IEntity {
  private _id: EntityId;
  private _participants: BudgetParticipant[];

  private constructor(participants: BudgetParticipant[]) {
    this._id = EntityId.create();
    this._participants = participants;
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }

  get participants(): string[] {
    return this._participants.map((p) => p.id);
  }

  get participantCount(): number {
    return this._participants.length;
  }

  addParticipant(userId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    if (this._participants.some((p) => p.id === userId)) return either;

    const participantOrError = BudgetParticipant.create({ id: userId });
    if (participantOrError.hasError) {
      either.addManyErrors(participantOrError.errors);
      return either;
    }

    this._participants.push(participantOrError.data!);
    return either;
  }

  removeParticipant(userId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const index = this._participants.findIndex((p) => p.id === userId);
    if (index === -1) {
      either.addError(new NotFoundError('participantId'));
      return either;
    }

    this._participants.splice(index, 1);
    return either;
  }

  static create(
    data: CreateBudgetParticipantsDTO,
  ): Either<DomainError, BudgetParticipants> {
    const either = new Either<DomainError, BudgetParticipants>();

    const participants = data.participantIds.map((participantId) => {
      const participantOrError = BudgetParticipant.create({
        id: participantId,
      });
      if (participantOrError.hasError)
        either.addManyErrors(participantOrError.errors);

      return participantOrError.data!;
    });

    if (either.hasError) return either;

    const budgetParticipants = new BudgetParticipants(participants);
    either.setData(budgetParticipants);
    return either;
  }
}
