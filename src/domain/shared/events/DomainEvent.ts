import { IDomainEvent } from './IDomainEvent';

export abstract class DomainEvent implements IDomainEvent {
  public readonly occurredOn: Date;
  public readonly eventVersion: number = 1;

  constructor(public readonly aggregateId: string) {
    this.occurredOn = new Date();
  }
}
