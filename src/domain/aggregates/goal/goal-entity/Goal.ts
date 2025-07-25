import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { GoalAlreadyAchievedError } from '../errors/GoalAlreadyAchievedError';
import { GoalAlreadyDeletedError } from '../errors/GoalAlreadyDeletedError';
import { InvalidGoalAmountError } from '../errors/InvalidGoalAmountError';
import { GoalCreatedEvent } from '../events/GoalCreatedEvent';
import { GoalUpdatedEvent } from '../events/GoalUpdatedEvent';
import { GoalDeletedEvent } from '../events/GoalDeletedEvent';
import { GoalAmountAddedEvent } from '../events/GoalAmountAddedEvent';
import { GoalAchievedEvent } from '../events/GoalAchievedEvent';

export interface CreateGoalDTO {
  name: string;
  totalAmount: number;
  accumulatedAmount?: number;
  deadline?: Date;
  budgetId: string;
}

export interface UpdateGoalDTO {
  name: string;
  totalAmount: number;
  deadline?: Date;
}

export interface RestoreGoalDTO {
  id: string;
  name: string;
  totalAmount: number;
  accumulatedAmount: number;
  deadline?: Date;
  budgetId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddAmountToGoalDTO {
  amount: number;
}

export class Goal extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _isDeleted = false;

  private constructor(
    private _name: EntityName,
    private _totalAmount: MoneyVo,
    private _deadline: Date | undefined,
    private readonly _budgetId: EntityId,
    private _accumulatedAmount: MoneyVo,
    existingId?: EntityId,
  ) {
    super();

    this._id = existingId || EntityId.create();
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
  get isDeleted(): boolean {
    return this._isDeleted;
  }

  addAmount(amount: number): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new GoalAlreadyDeletedError());
    if (this.isAchieved())
      return Either.error<DomainError, void>(new GoalAlreadyAchievedError());

    const amountVo = MoneyVo.create(amount);
    if (amountVo.hasError) return Either.errors(amountVo.errors);

    const newAccumulated = this.accumulatedAmount + amount;
    if (newAccumulated > this.totalAmount)
      return Either.error<DomainError, void>(new InvalidGoalAmountError());

    const newAccumulatedVo = MoneyVo.create(newAccumulated);
    if (newAccumulatedVo.hasError)
      return Either.errors(newAccumulatedVo.errors);

    this._accumulatedAmount = newAccumulatedVo;
    this._updatedAt = new Date();

    this.addEvent(
      new GoalAmountAddedEvent(
        this.id,
        amount,
        this.accumulatedAmount,
        this.budgetId,
      ),
    );

    const achievedNow = this.isAchieved();
    if (achievedNow) {
      this.addEvent(
        new GoalAchievedEvent(
          this.id,
          this.name,
          this.totalAmount,
          new Date(),
          this.budgetId,
        ),
      );
    }

    return Either.success();
  }

  update(data: UpdateGoalDTO): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new GoalAlreadyDeletedError());

    const nameVo = EntityName.create(data.name);
    const totalVo = MoneyVo.create(data.totalAmount);
    if (nameVo.hasError || totalVo.hasError) {
      const e = new Either<DomainError, void>();
      if (nameVo.hasError) e.addManyErrors(nameVo.errors);
      if (totalVo.hasError) e.addManyErrors(totalVo.errors);
      return e;
    }

    if (data.totalAmount < this.accumulatedAmount)
      return Either.error<DomainError, void>(new InvalidGoalAmountError());

    const prevName = this.name;
    const prevTotal = this.totalAmount;
    const prevDeadline = this.deadline;

    let changed = false;
    if (nameVo.value!.name !== this.name) {
      this._name = nameVo;
      changed = true;
    }
    if (totalVo.value!.cents !== this.totalAmount) {
      this._totalAmount = totalVo;
      changed = true;
    }
    if ((data.deadline ?? null) !== (this._deadline ?? null)) {
      this._deadline = data.deadline;
      changed = true;
    }

    if (changed) {
      this._updatedAt = new Date();
      this.addEvent(
        new GoalUpdatedEvent(
          this.id,
          prevName,
          this.name,
          prevTotal,
          this.totalAmount,
          prevDeadline,
          this._deadline,
        ),
      );
    }

    return Either.success();
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new GoalAlreadyDeletedError());

    this._isDeleted = true;
    this._updatedAt = new Date();

    this.addEvent(new GoalDeletedEvent(this.id, this.name, this.budgetId));

    return Either.success();
  }

  isAchieved(): boolean {
    return this.accumulatedAmount >= this.totalAmount;
  }

  getProgress(): number {
    return Math.min(100, (this.accumulatedAmount / this.totalAmount) * 100);
  }

  getRemainingAmount(): number {
    const remaining = this.totalAmount - this.accumulatedAmount;
    return remaining > 0 ? remaining : 0;
  }

  isOverdue(): boolean {
    if (!this._deadline) return false;
    const today = new Date();
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );
    return endOfToday > this._deadline && !this.isAchieved();
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

    if (accumulatedAmountVo.value && totalAmountVo.value) {
      if (accumulatedAmountVo.value.cents > totalAmountVo.value.cents)
        either.addError(new InvalidGoalAmountError());
    }

    if (either.hasError) return either;

    const goal = new Goal(
      nameVo,
      totalAmountVo,
      data.deadline,
      budgetIdVo,
      accumulatedAmountVo,
    );

    goal.addEvent(
      new GoalCreatedEvent(
        goal.id,
        goal.name,
        goal.totalAmount,
        goal.deadline,
        goal.budgetId,
      ),
    );

    return Either.success<DomainError, Goal>(goal);
  }

  static restore(data: RestoreGoalDTO): Either<DomainError, Goal> {
    const either = new Either<DomainError, Goal>();

    const idVo = EntityId.fromString(data.id);
    const nameVo = EntityName.create(data.name);
    const totalAmountVo = MoneyVo.create(data.totalAmount);
    const accumulatedAmountVo = MoneyVo.create(data.accumulatedAmount);
    const budgetIdVo = EntityId.fromString(data.budgetId);

    if (idVo.hasError) either.addManyErrors(idVo.errors);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (totalAmountVo.hasError) either.addManyErrors(totalAmountVo.errors);
    if (accumulatedAmountVo.hasError)
      either.addManyErrors(accumulatedAmountVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (accumulatedAmountVo.value && totalAmountVo.value) {
      if (accumulatedAmountVo.value.cents > totalAmountVo.value.cents)
        either.addError(new InvalidGoalAmountError());
    }

    if (either.hasError) return either;

    const goal = new Goal(
      nameVo,
      totalAmountVo,
      data.deadline,
      budgetIdVo,
      accumulatedAmountVo,
      idVo,
    );

    Object.defineProperty(goal, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    goal._updatedAt = data.updatedAt;
    goal._isDeleted = data.isDeleted;

    return Either.success<DomainError, Goal>(goal);
  }
}
