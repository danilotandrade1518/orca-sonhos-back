import { IDomainEvent } from './events/IDomainEvent';

export abstract class AggregateRoot {
  private _events: IDomainEvent[] = [];

  protected addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }

  getEvents(): IDomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }

  hasEvents(): boolean {
    return this._events.length > 0;
  }
}
