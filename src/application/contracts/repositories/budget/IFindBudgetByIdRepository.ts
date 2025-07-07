import { Either } from '@either';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

export interface IFindBudgetByIdRepository {
  execute(id: EntityId): Promise<Either<Error, Budget | null>>;
}
