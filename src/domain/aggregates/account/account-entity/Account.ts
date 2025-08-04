import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { BalanceVo } from '../../../shared/value-objects/balance-vo/BalanceVo';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { DeletedAccountError } from '../errors/DeletedAccountError';
import { InsufficientBalanceError } from '../errors/InsufficientBalanceError';
import { InvalidAccountDataError } from '../errors/InvalidAccountDataError';
import { ReconciliationNotNecessaryError } from '../errors/ReconciliationNotNecessaryError';
import { AccountDeletedEvent } from '../events/AccountDeletedEvent';
import { AccountReconciledEvent } from '../events/AccountReconciledEvent';
import { AccountUpdatedEvent } from '../events/AccountUpdatedEvent';
import {
  AccountType,
  AccountTypeEnum,
} from '../value-objects/account-type/AccountType';
import { EntityName } from './../../../shared/value-objects/entity-name/EntityName';
import { InvalidTransferAmountError } from './errors/InvalidTransferAmountError';

export interface CreateAccountDTO {
  name: string;
  type: AccountTypeEnum;
  budgetId: string;
  initialBalance?: number;
  description?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  description?: string;
  initialBalance?: number;
}

export class Account extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _isDeleted = false;

  private constructor(
    private _name: EntityName,
    private readonly _type: AccountType,
    private readonly _budgetId: EntityId,
    private _balance: BalanceVo,
    private _description?: string,
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
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

  get budgetId(): string | null {
    return this._budgetId.value?.id ?? null;
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

  update(data: UpdateAccountDTO): Either<DomainError, Account> {
    const either = new Either<DomainError, Account>();

    const newName = data.name ?? this.name;
    const newDescription = data.description ?? this.description;
    const newInitialBalance = data.initialBalance ?? this.balance;

    if (newName === null) {
      return Either.errors<DomainError, Account>([
        new InvalidAccountDataError('Account name cannot be null'),
      ]);
    }
    if (newInitialBalance === null) {
      return Either.errors<DomainError, Account>([
        new InvalidAccountDataError('Account balance cannot be null'),
      ]);
    }

    const nameVo = EntityName.create(newName);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const balanceVo = BalanceVo.create(newInitialBalance);
    if (balanceVo.hasError) either.addManyErrors(balanceVo.errors);

    if (either.hasError) return either;

    const hasNameChanged = newName !== this.name;
    const hasDescriptionChanged = newDescription !== this.description;
    const hasInitialBalanceChanged = newInitialBalance !== this.balance;

    if (
      !hasNameChanged &&
      !hasDescriptionChanged &&
      !hasInitialBalanceChanged
    ) {
      either.setData(this);
      return either;
    }

    const updatedAccount = new Account(
      nameVo,
      this._type,
      this._budgetId,
      balanceVo,
      newDescription,
      this._id,
    );

    if (hasNameChanged || hasInitialBalanceChanged) {
      updatedAccount.addEvent(
        new AccountUpdatedEvent(
          updatedAccount.id,
          updatedAccount.budgetId!,
          this.name!,
          newName,
          this.balance!,
          newInitialBalance,
          this.description,
          newDescription,
        ),
      );
    }

    either.setData(updatedAccount);
    return either;
  }

  delete(): void {
    this._updatedAt = new Date();
    this._isDeleted = true;
    this.addEvent(
      new AccountDeletedEvent(
        this.id,
        this.budgetId!,
        this.name!,
        this.type as AccountTypeEnum,
        this.balance!,
        this.description,
      ),
    );
  }

  static create(data: CreateAccountDTO): Either<DomainError, Account> {
    const either = new Either<DomainError, Account>();

    const name = EntityName.create(data.name);
    either.addManyErrors(name.errors);

    const type = AccountType.create(data.type);
    either.addManyErrors(type.errors);

    const budgetId = EntityId.fromString(data.budgetId);
    either.addManyErrors(budgetId.errors);

    const balance = BalanceVo.create(data.initialBalance ?? 0);
    either.addManyErrors(balance.errors);

    if (either.hasError) return either;

    either.setData(
      new Account(name, type, budgetId, balance, data.description),
    );
    return either;
  }

  static restore(data: {
    id: string;
    name: string;
    type: AccountTypeEnum;
    budgetId: string;
    balance: number;
    description?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Either<DomainError, Account> {
    const either = new Either<DomainError, Account>();

    const nameVo = EntityName.create(data.name);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);

    const typeVo = AccountType.create(data.type);
    if (typeVo.hasError) either.addManyErrors(typeVo.errors);

    const budgetIdVo = EntityId.fromString(data.budgetId);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    const balanceVo = BalanceVo.create(data.balance);
    if (balanceVo.hasError) either.addManyErrors(balanceVo.errors);

    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    if (either.hasError) return either;

    const account = new Account(
      nameVo,
      typeVo,
      budgetIdVo,
      balanceVo,
      data.description,
      idVo,
    );

    Object.defineProperty(account, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    account._updatedAt = data.updatedAt;
    account._isDeleted = data.isDeleted;

    either.setData(account);
    return either;
  }

  canTransfer(amount: number): Either<DomainError, void> {
    if (amount <= 0) {
      return Either.errors<DomainError, void>([
        new InvalidTransferAmountError(),
      ]);
    }

    const currentBalance = this._balance.value?.cents ?? 0;
    const allowsNegativeBalance =
      this._type.value?.allowsNegativeBalance ?? false;

    if (!allowsNegativeBalance && currentBalance < amount) {
      return Either.errors<DomainError, void>([new InsufficientBalanceError()]);
    }

    return Either.success(undefined);
  }

  canReceiveTransfer(amount: number): Either<DomainError, void> {
    if (amount <= 0) {
      return Either.errors<DomainError, void>([
        new InvalidTransferAmountError(),
      ]);
    }

    if (this._isDeleted) {
      return Either.errors<DomainError, void>([new DeletedAccountError()]);
    }

    return Either.success(undefined);
  }

  reconcile(
    realBalance: number,
    justification: string,
  ): Either<DomainError, number> {
    const balanceVo = BalanceVo.create(realBalance);

    const either = new Either<DomainError, number>();
    if (balanceVo.hasError) either.addManyErrors(balanceVo.errors);

    const current = this._balance.value?.cents ?? 0;
    const diff = parseFloat((realBalance - current).toFixed(2));
    const diffVo = BalanceVo.create(diff);
    if (diffVo.hasError) either.addManyErrors(diffVo.errors);

    if (either.hasError) return either;

    if (Math.abs(diff) < 1) {
      return Either.errors<DomainError, number>([
        new ReconciliationNotNecessaryError(),
      ]);
    }

    this._balance = balanceVo;
    this._updatedAt = new Date();

    this.addEvent(
      new AccountReconciledEvent(
        this.id,
        this.budgetId!,
        current,
        realBalance,
        diff,
        justification,
      ),
    );

    return Either.success(diff);
  }
}
