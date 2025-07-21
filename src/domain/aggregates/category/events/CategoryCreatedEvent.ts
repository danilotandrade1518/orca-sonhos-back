import { DomainEvent } from '../../../shared/events/DomainEvent';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';

export class CategoryCreatedEvent extends DomainEvent {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly categoryType: CategoryTypeEnum,
    public readonly budgetId: string,
  ) {
    super(categoryId);
  }
}
