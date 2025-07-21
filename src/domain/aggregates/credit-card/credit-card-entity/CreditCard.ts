import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { CreditCardDayVo } from '../value-objects/credit-card-day/CreditCardDayVo';
import { CreditCardCreatedEvent } from '../events/CreditCardCreatedEvent';
import { CreditCardUpdatedEvent } from '../events/CreditCardUpdatedEvent';
import { CreditCardDeletedEvent } from '../events/CreditCardDeletedEvent';
import { CreditCardAlreadyDeletedError } from '../errors/CreditCardAlreadyDeletedError';

export interface CreateCreditCardDTO {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  budgetId: string;
}

export interface UpdateCreditCardDTO {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface RestoreCreditCardDTO {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  budgetId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreditCard extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _name: EntityName;
  private _limit: MoneyVo;
  private _closingDay: CreditCardDayVo;
  private _dueDay: CreditCardDayVo;
  private readonly _budgetId: EntityId;

  private _updatedAt: Date;
  private _isDeleted = false;

  private constructor(
    name: EntityName,
    limit: MoneyVo,
    closingDay: CreditCardDayVo,
    dueDay: CreditCardDayVo,
    budgetId: EntityId,
    existingId?: EntityId,
  ) {
    super();
    this._name = name;
    this._limit = limit;
    this._closingDay = closingDay;
    this._dueDay = dueDay;
    this._budgetId = budgetId;
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
  get limit(): number {
    return this._limit.value?.cents ?? 0;
  }
  get closingDay(): number {
    return this._closingDay.value?.day ?? 0;
  }
  get dueDay(): number {
    return this._dueDay.value?.day ?? 0;
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

  static create(data: CreateCreditCardDTO): Either<DomainError, CreditCard> {
    const either = new Either<DomainError, CreditCard>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const limitVo = MoneyVo.create(data.limit);
    if (limitVo.hasError) either.addManyErrors(limitVo.errors);

    const closingDayVo = CreditCardDayVo.create(data.closingDay);
    if (closingDayVo.hasError) either.addManyErrors(closingDayVo.errors);

    const dueDayVo = CreditCardDayVo.create(data.dueDay);
    if (dueDayVo.hasError) either.addManyErrors(dueDayVo.errors);

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (either.hasError) return either;

    const card = new CreditCard(
      nameVo,
      limitVo,
      closingDayVo,
      dueDayVo,
      budgetIdVo,
    );

    card.addEvent(
      new CreditCardCreatedEvent(
        card.id,
        card.name,
        card.limit,
        card.closingDay,
        card.dueDay,
        card.budgetId,
      ),
    );

    return Either.success<DomainError, CreditCard>(card);
  }

  update(data: UpdateCreditCardDTO): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardAlreadyDeletedError(),
      );

    const nameVo = EntityName.create(data.name);
    const limitVo = MoneyVo.create(data.limit);
    const closingDayVo = CreditCardDayVo.create(data.closingDay);
    const dueDayVo = CreditCardDayVo.create(data.dueDay);

    if (
      nameVo.hasError ||
      limitVo.hasError ||
      closingDayVo.hasError ||
      dueDayVo.hasError
    ) {
      const errors: DomainError[] = [];
      if (nameVo.hasError) errors.push(...nameVo.errors);
      if (limitVo.hasError) errors.push(...limitVo.errors);
      if (closingDayVo.hasError) errors.push(...closingDayVo.errors);
      if (dueDayVo.hasError) errors.push(...dueDayVo.errors);
      return Either.errors<DomainError, void>(errors);
    }

    const previousName = this.name;
    const previousLimit = this.limit;
    const previousClosingDay = this.closingDay;
    const previousDueDay = this.dueDay;

    const hasChanges =
      previousName !== data.name ||
      previousLimit !== data.limit ||
      previousClosingDay !== data.closingDay ||
      previousDueDay !== data.dueDay;

    if (!hasChanges) return Either.success<DomainError, void>();

    this._name = nameVo;
    this._limit = limitVo;
    this._closingDay = closingDayVo;
    this._dueDay = dueDayVo;
    this._updatedAt = new Date();

    this.addEvent(
      new CreditCardUpdatedEvent(
        this.id,
        previousName,
        data.name,
        previousLimit,
        data.limit,
        previousClosingDay,
        data.closingDay,
        previousDueDay,
        data.dueDay,
      ),
    );

    return Either.success<DomainError, void>();
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardAlreadyDeletedError(),
      );

    this._isDeleted = true;
    this._updatedAt = new Date();
    this.addEvent(new CreditCardDeletedEvent(this.id));

    return Either.success<DomainError, void>();
  }

  static restore(data: RestoreCreditCardDTO): Either<DomainError, CreditCard> {
    const either = new Either<DomainError, CreditCard>();

    const nameVo = EntityName.create(data.name);
    const limitVo = MoneyVo.create(data.limit);
    const closingDayVo = CreditCardDayVo.create(data.closingDay);
    const dueDayVo = CreditCardDayVo.create(data.dueDay);
    const budgetIdVo = EntityId.fromString(data.budgetId);
    const idVo = EntityId.fromString(data.id);

    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (limitVo.hasError) either.addManyErrors(limitVo.errors);
    if (closingDayVo.hasError) either.addManyErrors(closingDayVo.errors);
    if (dueDayVo.hasError) either.addManyErrors(dueDayVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    if (either.hasError) return either;

    const card = new CreditCard(
      nameVo,
      limitVo,
      closingDayVo,
      dueDayVo,
      budgetIdVo,
      idVo,
    );

    Object.defineProperty(card, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    card._updatedAt = data.updatedAt;
    card._isDeleted = data.isDeleted;

    either.setData(card);
    return either;
  }
}
