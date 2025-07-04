import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { IEntity } from '../../../shared/entity';
import { BalanceVo } from '../../../shared/value-objects/balance-vo/BalanceVo';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import {
  AccountType,
  AccountTypeEnum,
} from '../value-objects/account-type/AccountType';
import { EntityName } from './../../../shared/value-objects/entity-name/EntityName';

export interface CreateAccountDTO {
  name: string;
  type: AccountTypeEnum;
  initialBalance?: number;
  description?: string;
}

export class Account implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;

  private constructor(
    private _name: EntityName,
    private readonly _type: AccountType,
    private _balance: BalanceVo,
    private _description?: string,
  ) {
    this._id = EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get name(): string | null {
    return this._name.value?.name ?? null;
  }

  get type(): string | null {
    return this._type.value?.type ?? null;
  }

  get balance(): number | null {
    return this._balance.value?.cents ?? null;
  }

  get description(): string | undefined {
    return this._description;
  }

  static create(data: CreateAccountDTO): Either<DomainError, Account> {
    const either = new Either<DomainError, Account>();

    const name = EntityName.create(data.name);
    either.addManyErrors(name.errors);

    const type = AccountType.create(data.type);
    either.addManyErrors(type.errors);

    const balance = BalanceVo.create(data.initialBalance ?? 0);
    either.addManyErrors(balance.errors);

    if (either.hasError) return either;

    either.setData(new Account(name, type, balance, data.description));
    return either;
  }

  updateName(newName: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const newNameVo = EntityName.create(newName);
    either.addManyErrors(newNameVo.errors);

    if (either.hasError) return either;

    this._name = newNameVo;
    this._updatedAt = new Date();

    return either;
  }

  updateDescription(newDescription?: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    this._description = newDescription;
    this._updatedAt = new Date();

    return either;
  }

  addAmount(amount: number): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const currentBalance = this._balance.value?.cents ?? 0;
    const newBalance = BalanceVo.create(currentBalance + amount);
    either.addManyErrors(newBalance.errors);

    if (either.hasError) return either;

    this._balance = newBalance;
    this._updatedAt = new Date();

    return either;
  }

  subtractAmount(amount: number): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const currentBalance = this._balance.value?.cents ?? 0;
    const newBalance = BalanceVo.create(currentBalance - amount);
    either.addManyErrors(newBalance.errors);

    if (either.hasError) return either;

    this._balance = newBalance;
    this._updatedAt = new Date();

    return either;
  }

  setBalance(newBalance: number): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    const newBalanceVo = BalanceVo.create(newBalance);
    either.addManyErrors(newBalanceVo.errors);

    if (either.hasError) return either;

    this._balance = newBalanceVo;
    this._updatedAt = new Date();

    return either;
  }

  canSubtract(amount: number): boolean {
    const currentBalance = this._balance.value?.cents ?? 0;
    return currentBalance >= amount;
  }
}
