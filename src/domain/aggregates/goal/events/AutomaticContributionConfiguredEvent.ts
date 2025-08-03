import { DomainEvent } from '../../../shared/events/DomainEvent';
import { FrequencyType } from '../enums/FrequencyType';

export class AutomaticContributionConfiguredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly contributionAmount: number,
    public readonly frequencyType: FrequencyType,
    public readonly executionDay: number,
    public readonly nextExecutionDate: Date,
  ) {
    super(aggregateId);
  }
}
