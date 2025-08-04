import { DomainEvent } from '../../../shared/events/DomainEvent';
import { ContributionSource } from '../value-objects/ContributionSource';

export class EnvelopeContributionMadeEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly amount: number,
    public readonly newBalance: number,
    public readonly source: ContributionSource,
    public readonly description?: string,
  ) {
    super(aggregateId);
  }
}
