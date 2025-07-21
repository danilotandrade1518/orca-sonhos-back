import { DomainEvent } from '../../../shared/events/DomainEvent';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';

export class CategoryUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousName: string,
    public readonly newName: string,
    public readonly previousType: CategoryTypeEnum,
    public readonly newType: CategoryTypeEnum,
  ) {
    super(aggregateId);
  }
}
