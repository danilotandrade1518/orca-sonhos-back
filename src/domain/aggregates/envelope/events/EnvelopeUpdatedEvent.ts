import { DomainEvent } from '../../../shared/events/DomainEvent';

export class EnvelopeUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly budgetId: string,
    public readonly previousName: string,
    public readonly newName: string,
    public readonly previousDescription: string | undefined,
    public readonly newDescription: string | undefined,
    public readonly previousMonthlyAllocation: number,
    public readonly newMonthlyAllocation: number,
    public readonly previousCategories: string[],
    public readonly newCategories: string[],
    public readonly previousColor?: string,
    public readonly newColor?: string,
    public readonly previousIcon?: string,
    public readonly newIcon?: string,
  ) {
    super(aggregateId);
  }
}
