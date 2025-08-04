import { DomainEvent } from '../../../shared/events/DomainEvent';

export class ParticipantAddedToBudgetEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly participantId: string,
    public readonly ownerId: string,
  ) {
    super(aggregateId);
  }
}
