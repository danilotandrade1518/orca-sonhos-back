export interface IDomainEvent {
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly eventVersion: number;
}
