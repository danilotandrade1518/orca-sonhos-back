import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { CreditCardDayVo } from '../value-objects/credit-card-day/CreditCardDayVo';

export interface CreateCreditCardDTO {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  budgetId: string;
}

export class CreditCard {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private readonly _name: EntityName;
  private readonly _limit: MoneyVo;
  private readonly _closingDay: CreditCardDayVo;
  private readonly _dueDay: CreditCardDayVo;
  private readonly _budgetId: EntityId;

  private _updatedAt: Date;

  private constructor(
    name: EntityName,
    limit: MoneyVo,
    closingDay: CreditCardDayVo,
    dueDay: CreditCardDayVo,
    budgetId: EntityId,
  ) {
    this._name = name;
    this._limit = limit;
    this._closingDay = closingDay;
    this._dueDay = dueDay;
    this._budgetId = budgetId;
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

    return Either.success<DomainError, CreditCard>(card);
  }
}
