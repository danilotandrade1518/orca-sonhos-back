import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { BalanceVo } from '../../../shared/value-objects/balance-vo/BalanceVo';
import { Either } from '@either';
import { EnvelopeUpdatedEvent } from '../events/EnvelopeUpdatedEvent';

export interface CreateEnvelopeDTO {
  budgetId: string;
  name: string;
  description?: string;
  monthlyAllocation: number;
  associatedCategories?: string[];
  color?: string;
  icon?: string;
}

export interface UpdateEnvelopeDTO {
  name?: string;
  description?: string;
  monthlyAllocation?: number;
  associatedCategories?: string[];
  color?: string;
  icon?: string;
}

export class Envelope extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _budgetId: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _name: EntityName;
  private _description?: string;
  private _monthlyAllocation: MoneyVo;
  private _balance: BalanceVo;
  private _associatedCategories: EntityId[];
  private _color?: string;
  private _icon?: string;

  private constructor(
    budgetId: EntityId,
    name: EntityName,
    monthlyAllocation: MoneyVo,
    balance: BalanceVo,
    associatedCategories: EntityId[],
    description?: string,
    color?: string,
    icon?: string,
    existingId?: EntityId,
  ) {
    super();
    this._id = existingId || EntityId.create();
    this._budgetId = budgetId;
    this._name = name;
    this._monthlyAllocation = monthlyAllocation;
    this._balance = balance;
    this._associatedCategories = associatedCategories;
    this._description = description;
    this._color = color;
    this._icon = icon;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value!.id;
  }

  get budgetId(): string {
    return this._budgetId.value!.id;
  }

  get name(): string {
    return this._name.value!.name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get monthlyAllocation(): number {
    return this._monthlyAllocation.value!.cents;
  }

  get balance(): number {
    return this._balance.value!.cents;
  }

  get associatedCategories(): string[] {
    return this._associatedCategories.map((c) => c.value!.id);
  }

  get color(): string | undefined {
    return this._color;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(data: CreateEnvelopeDTO): Either<DomainError, Envelope> {
    const either = new Either<DomainError, Envelope>();

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const allocationVo = MoneyVo.create(data.monthlyAllocation);
    if (allocationVo.hasError) either.addManyErrors(allocationVo.errors);

    const associated: EntityId[] = [];
    if (data.associatedCategories) {
      for (const id of data.associatedCategories) {
        const vo = EntityId.fromString(id);
        if (vo.hasError) {
          either.addManyErrors(vo.errors);
        } else {
          associated.push(vo);
        }
      }
    }

    if (either.hasError) return either;

    const balanceVo = BalanceVo.create(0);
    const envelope = new Envelope(
      budgetIdVo,
      nameVo,
      allocationVo,
      balanceVo,
      associated,
      data.description,
      data.color,
      data.icon,
    );
    either.setData(envelope);
    return either;
  }

  update(data: UpdateEnvelopeDTO): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    let nameVo: EntityName | undefined;
    if (data.name !== undefined) {
      nameVo = EntityName.create(data.name);
      if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    }

    let allocationVo: MoneyVo | undefined;
    if (data.monthlyAllocation !== undefined) {
      allocationVo = MoneyVo.create(data.monthlyAllocation);
      if (allocationVo.hasError) either.addManyErrors(allocationVo.errors);
    }

    const categories: EntityId[] = [];
    let categoriesChanged = false;
    if (data.associatedCategories !== undefined) {
      for (const id of data.associatedCategories) {
        const vo = EntityId.fromString(id);
        if (vo.hasError) {
          either.addManyErrors(vo.errors);
        } else {
          categories.push(vo);
        }
      }
      categoriesChanged = true;
    }

    if (either.hasError) return either;

    const nameChanged =
      nameVo !== undefined && nameVo.value!.name !== this._name.value!.name;
    const descChanged =
      data.description !== undefined && data.description !== this._description;
    const allocationChanged =
      allocationVo !== undefined &&
      allocationVo.value!.cents !== this._monthlyAllocation.value!.cents;
    const colorChanged = data.color !== undefined && data.color !== this._color;
    const iconChanged = data.icon !== undefined && data.icon !== this._icon;
    if (
      !nameChanged &&
      !descChanged &&
      !allocationChanged &&
      !categoriesChanged &&
      !colorChanged &&
      !iconChanged
    ) {
      return Either.success();
    }

    const prevName = this.name;
    const prevDesc = this._description;
    const prevAlloc = this.monthlyAllocation;
    const prevCats = this.associatedCategories;
    const prevColor = this._color;
    const prevIcon = this._icon;

    if (nameChanged && nameVo) this._name = nameVo;
    if (descChanged) this._description = data.description;
    if (allocationChanged && allocationVo) this._monthlyAllocation = allocationVo;
    if (categoriesChanged) this._associatedCategories = categories;
    if (colorChanged) this._color = data.color;
    if (iconChanged) this._icon = data.icon;

    this._updatedAt = new Date();

    this.addEvent(
      new EnvelopeUpdatedEvent(
        this.id,
        this.budgetId,
        prevName,
        this.name,
        prevDesc,
        this._description,
        prevAlloc,
        this.monthlyAllocation,
        prevCats,
        this.associatedCategories,
        prevColor,
        this._color,
        prevIcon,
        this._icon,
      ),
    );

    return Either.success();
  }
}
