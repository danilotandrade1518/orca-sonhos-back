import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
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

  updateName(newName: string): Either<DomainError, void> {
    const newNameVo = EntityName.create(newName);

    if (newNameVo.hasError)
      return Either.errors<DomainError, void>(newNameVo.errors);

    this._name = newNameVo;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  updateDescription(newDescription?: string): Either<DomainError, void> {
    this._description = newDescription;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  addAmount(amount: number): Either<DomainError, void> {
    const currentBalance = this._balance.value?.cents ?? 0;
    const newBalance = BalanceVo.create(currentBalance + amount);

    if (newBalance.hasError)
      return Either.errors<DomainError, void>(newBalance.errors);

    this._balance = newBalance;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  subtractAmount(amount: number): Either<DomainError, void> {
    const currentBalance = this._balance.value?.cents ?? 0;
    const newBalance = BalanceVo.create(currentBalance - amount);

    if (newBalance.hasError)
      return Either.errors<DomainError, void>(newBalance.errors);

    this._balance = newBalance;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  setBalance(newBalance: number): Either<DomainError, void> {
    const newBalanceVo = BalanceVo.create(newBalance);

    if (newBalanceVo.hasError)
      return Either.errors<DomainError, void>(newBalanceVo.errors);

    this._balance = newBalanceVo;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  canSubtract(amount: number): boolean {
    const currentBalance = this._balance.value?.cents ?? 0;
    return currentBalance >= amount;
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
}
