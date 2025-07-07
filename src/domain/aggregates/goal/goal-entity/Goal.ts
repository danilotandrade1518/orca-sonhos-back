import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { IEntity } from './../../../shared/entity';

export interface CreateGoalDTO {
  name: string;
  totalAmount: number;
  accumulatedAmount?: number;
  deadline?: Date;
  budgetId: string;
}

export class Goal implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;

  private constructor(
    private readonly _name: EntityName,
    private readonly _totalAmount: MoneyVo,
    private readonly _deadline: Date | undefined,
    private readonly _budgetId: EntityId,
    private _accumulatedAmount: MoneyVo,
  ) {
    this._id = EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }
  get name(): string {
    return this._name.value?.name ?? '';
  }
  get totalAmount(): number {
    return this._totalAmount.value?.cents ?? 0;
  }
  get accumulatedAmount(): number {
    return this._accumulatedAmount.value?.cents ?? 0;
  }
  get deadline(): Date | undefined {
    return this._deadline;
  }
  get budgetId(): string {
    return this._budgetId.value?.id ?? '';
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  addAmount(amount: number): Either<DomainError, void> {
    const newAmount = this.accumulatedAmount + amount;

    const newAccumulatedVo = MoneyVo.create(newAmount);
    if (newAccumulatedVo.hasError)
      return Either.errors<DomainError, void>(newAccumulatedVo.errors);

    this._accumulatedAmount = newAccumulatedVo;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  static create(data: CreateGoalDTO): Either<DomainError, Goal> {
    const either = new Either<DomainError, Goal>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const totalAmountVo = MoneyVo.create(data.totalAmount);
    if (totalAmountVo.hasError) either.addManyErrors(totalAmountVo.errors);

    const accumulatedAmountVo = MoneyVo.create(data.accumulatedAmount ?? 0);
    if (accumulatedAmountVo.hasError)
      either.addManyErrors(accumulatedAmountVo.errors);

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (either.hasError) return either;

    const goal = new Goal(
      nameVo,
      totalAmountVo,
      data.deadline,
      budgetIdVo,
      accumulatedAmountVo,
    );

    return Either.success<DomainError, Goal>(goal);
  }
}
