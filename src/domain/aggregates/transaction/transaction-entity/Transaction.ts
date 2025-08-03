import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { TransactionAlreadyDeletedError } from '../errors/TransactionAlreadyDeletedError';
import { TransactionBusinessRuleError } from '../errors/TransactionBusinessRuleError';
import { TransactionCreatedEvent } from '../events/TransactionCreatedEvent';
import { TransactionDeletedEvent } from '../events/TransactionDeletedEvent';
import { ScheduledTransactionCancelledEvent } from '../events/ScheduledTransactionCancelledEvent';
import { TransactionUpdatedEvent } from '../events/TransactionUpdatedEvent';
import { TransactionDescription } from '../value-objects/transaction-description/TransactionDescription';
import {
  TransactionStatus,
  TransactionStatusEnum,
} from '../value-objects/transaction-status/TransactionStatus';
import {
  TransactionType,
  TransactionTypeEnum,
} from '../value-objects/transaction-type/TransactionType';
import { CancellationReason } from '../value-objects/cancellation-reason/CancellationReason';
import { TransactionNotScheduledError } from '../errors/TransactionNotScheduledError';
import { TransactionAlreadyExecutedError } from '../errors/TransactionAlreadyExecutedError';

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  type: TransactionTypeEnum;
  transactionDate: Date;
  categoryId: string;
  budgetId: string;
  accountId: string;
  status?: TransactionStatusEnum;
  creditCardId?: string;
}

export interface UpdateTransactionDTO {
  description: string;
  amount: number;
  type: TransactionTypeEnum;
  accountId: string;
  categoryId?: string;
  transactionDate?: Date;
}

export class Transaction extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _isDeleted: boolean = false;
  private _cancellationReason?: CancellationReason;
  private _cancelledAt?: Date;

  private constructor(
    private readonly _description: TransactionDescription,
    private readonly _amount: MoneyVo,
    private readonly _type: TransactionType,
    private readonly _transactionDate: Date,
    private readonly _categoryId: EntityId,
    private readonly _budgetId: EntityId,
    private readonly _accountId: EntityId,
    private _status: TransactionStatus,
    private readonly _creditCardId?: EntityId,
    private readonly _existingId?: EntityId,
    cancellationReason?: CancellationReason,
    cancelledAt?: Date,
  ) {
    super();

    this._id = this._existingId || EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._cancellationReason = cancellationReason;
    this._cancelledAt = cancelledAt;
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }

  get description(): string {
    return this._description.value?.description ?? '';
  }

  get amount(): number {
    return this._amount.value?.cents ?? 0;
  }

  get type(): TransactionTypeEnum {
    return this._type.value?.type ?? TransactionTypeEnum.EXPENSE;
  }

  get transactionDate(): Date {
    return this._transactionDate;
  }

  get categoryId(): string {
    return this._categoryId.value?.id ?? '';
  }

  get budgetId(): string {
    return this._budgetId.value?.id ?? '';
  }

  get accountId(): string {
    return this._accountId.value?.id ?? '';
  }

  get status(): TransactionStatusEnum {
    return this._status.value?.status ?? TransactionStatusEnum.SCHEDULED;
  }

  get creditCardId(): string | null {
    return this._creditCardId?.value?.id ?? null;
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

  get isCompleted(): boolean {
    return this.status === TransactionStatusEnum.COMPLETED;
  }

  get isScheduled(): boolean {
    return this.status === TransactionStatusEnum.SCHEDULED;
  }

  get isOverdue(): boolean {
    return this.status === TransactionStatusEnum.OVERDUE;
  }

  get isCancelled(): boolean {
    return this.status === TransactionStatusEnum.CANCELLED;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason?.value?.reason ?? null;
  }

  get cancelledAt(): Date | null {
    return this._cancelledAt ?? null;
  }

  complete(): Either<DomainError, void> {
    if (this.isCancelled)
      return Either.error<DomainError, void>(
        new TransactionBusinessRuleError(
          'Cannot complete a cancelled transaction',
        ),
      );

    this._status = TransactionStatus.create(TransactionStatusEnum.COMPLETED);
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  cancel(reason: CancellationReason): Either<DomainError, void> {
    if (reason.hasError) return Either.errors<DomainError, void>(reason.errors);
    if (this.isCompleted)
      return Either.error(new TransactionAlreadyExecutedError());

    if (this.isCancelled)
      return Either.error(
        new TransactionBusinessRuleError(
          'Cannot cancel a cancelled transaction',
        ),
      );

    if (!this.isScheduled)
      return Either.error(new TransactionNotScheduledError());

    const now = new Date();
    if (this._transactionDate <= now)
      return Either.error(new TransactionAlreadyExecutedError());

    this._status = TransactionStatus.create(TransactionStatusEnum.CANCELLED);
    this._cancellationReason = reason;
    this._cancelledAt = new Date();
    this._updatedAt = new Date();

    this.addEvent(
      new ScheduledTransactionCancelledEvent(
        this.id,
        this.accountId,
        this.budgetId,
        this.amount,
        this.type,
        reason.value!.reason,
        this._cancelledAt,
        this.categoryId,
        this.creditCardId || undefined,
        this.transactionDate,
      ),
    );

    return Either.success();
  }

  markAsOverdue(): Either<DomainError, void> {
    if (this.isCompleted || this.isCancelled)
      return Either.error<DomainError, void>(
        new TransactionBusinessRuleError(
          'Cannot mark completed or cancelled transaction as overdue',
        ),
      );

    const now = new Date();
    if (this._transactionDate >= now)
      return Either.error<DomainError, void>(
        new TransactionBusinessRuleError(
          'Cannot mark future transaction as overdue',
        ),
      );

    this._status = TransactionStatus.create(TransactionStatusEnum.OVERDUE);
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  delete(): Either<DomainError, Transaction> {
    const either = new Either<DomainError, Transaction>();

    if (this._isDeleted) {
      either.addError(new TransactionAlreadyDeletedError());
      return either;
    }

    this._isDeleted = true;
    this._updatedAt = new Date();

    this.addEvent(
      new TransactionDeletedEvent(
        this.id,
        this.accountId,
        this.budgetId,
        this.amount,
        this.type,
        this.description,
        this.status,
        this.categoryId,
        this.creditCardId || undefined,
        this.transactionDate,
      ),
    );

    either.setData(this);
    return either;
  }

  update(data: UpdateTransactionDTO): Either<DomainError, Transaction> {
    const either = new Either<DomainError, Transaction>();

    const newDescription = TransactionDescription.create(data.description);
    const newAmount = MoneyVo.create(data.amount);
    const newType = TransactionType.create(data.type);
    const newAccountId = EntityId.fromString(data.accountId);
    const newCategoryId = data.categoryId
      ? EntityId.fromString(data.categoryId)
      : undefined;

    if (newDescription.hasError) either.addManyErrors(newDescription.errors);
    if (newAmount.hasError) either.addManyErrors(newAmount.errors);
    if (newType.hasError) either.addManyErrors(newType.errors);
    if (newAccountId.hasError) either.addManyErrors(newAccountId.errors);
    if (newCategoryId?.hasError) either.addManyErrors(newCategoryId.errors);

    if (either.hasError) return either;

    const accountChanged = this.accountId !== data.accountId;
    const amountChanged = this.amount !== data.amount;
    const typeChanged = this.type !== data.type;

    const updatedTransaction = new Transaction(
      newDescription,
      newAmount,
      newType,
      data.transactionDate || this._transactionDate,
      newCategoryId || this._categoryId,
      this._budgetId,
      newAccountId,
      this._status,
      this._creditCardId,
      this._id,
      this._cancellationReason,
      this._cancelledAt,
    );

    if (accountChanged || amountChanged || typeChanged) {
      updatedTransaction.addEvent(
        new TransactionUpdatedEvent(
          this.id,
          this.accountId,
          data.accountId,
          this.amount,
          data.amount,
          this.type,
          data.type,
        ),
      );
    }

    either.setData(updatedTransaction);
    return either;
  }

  static create(data: CreateTransactionDTO): Either<DomainError, Transaction> {
    const either = new Either<DomainError, Transaction>();

    const description = TransactionDescription.create(data.description);
    const amount = MoneyVo.create(data.amount);
    const type = TransactionType.create(data.type);
    const categoryId = EntityId.fromString(data.categoryId);
    const budgetId = EntityId.fromString(data.budgetId);
    const accountId = EntityId.fromString(data.accountId);

    const status = data.status
      ? TransactionStatus.create(data.status)
      : TransactionStatus.create(
          Transaction.determineInitialStatus(data.transactionDate),
        );

    const creditCardId = data.creditCardId
      ? EntityId.fromString(data.creditCardId)
      : undefined;

    if (description.hasError) either.addManyErrors(description.errors);
    if (amount.hasError) either.addManyErrors(amount.errors);
    if (type.hasError) either.addManyErrors(type.errors);
    if (categoryId.hasError) either.addManyErrors(categoryId.errors);
    if (budgetId.hasError) either.addManyErrors(budgetId.errors);
    if (accountId.hasError) either.addManyErrors(accountId.errors);
    if (status.hasError) either.addManyErrors(status.errors);
    if (creditCardId?.hasError) either.addManyErrors(creditCardId.errors);

    if (either.hasError) return either;

    const transaction = new Transaction(
      description,
      amount,
      type,
      data.transactionDate,
      categoryId,
      budgetId,
      accountId,
      status,
      creditCardId,
      undefined,
      undefined,
      undefined,
    );

    transaction.addEvent(
      new TransactionCreatedEvent(
        transaction.id,
        data.accountId,
        data.amount,
        data.type,
        data.categoryId,
      ),
    );

    return Either.success<DomainError, Transaction>(transaction);
  }

  static restore(data: {
    id: string;
    description: string;
    amount: number;
    type: TransactionTypeEnum;
    accountId: string;
    categoryId: string;
    budgetId: string;
    transactionDate: Date;
    status: TransactionStatusEnum;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    cancellationReason?: string;
    cancelledAt?: Date;
  }): Either<DomainError, Transaction> {
    const either = new Either<DomainError, Transaction>();

    const description = TransactionDescription.create(data.description);
    const amount = MoneyVo.create(data.amount);
    const type = TransactionType.create(data.type);
    const accountId = EntityId.fromString(data.accountId);
    const budgetId = EntityId.fromString(data.budgetId);
    const categoryId = EntityId.fromString(data.categoryId);
    const status = TransactionStatus.create(data.status);
    const idVo = EntityId.fromString(data.id);
    const reasonVo = data.cancellationReason
      ? CancellationReason.create(data.cancellationReason)
      : undefined;

    if (description.hasError) either.addManyErrors(description.errors);
    if (amount.hasError) either.addManyErrors(amount.errors);
    if (type.hasError) either.addManyErrors(type.errors);
    if (accountId.hasError) either.addManyErrors(accountId.errors);
    if (budgetId.hasError) either.addManyErrors(budgetId.errors);
    if (categoryId.hasError) either.addManyErrors(categoryId.errors);
    if (status.hasError) either.addManyErrors(status.errors);
    if (idVo.hasError) either.addManyErrors(idVo.errors);
    if (reasonVo?.hasError) either.addManyErrors(reasonVo.errors);

    if (either.hasError) return either;

    const transaction = new Transaction(
      description,
      amount,
      type,
      data.transactionDate,
      categoryId,
      budgetId,
      accountId,
      status,
      undefined,
      idVo,
      reasonVo?.value ? reasonVo : undefined,
      data.cancelledAt,
    );

    Object.defineProperty(transaction, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    transaction._updatedAt = data.updatedAt;
    transaction._isDeleted = data.isDeleted;

    either.setData(transaction);
    return either;
  }

  private static determineInitialStatus(
    transactionDate: Date,
    providedStatus?: TransactionStatusEnum,
  ): TransactionStatusEnum {
    if (providedStatus) return providedStatus;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const transactionDay = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate(),
    );

    if (transactionDay > today) {
      return TransactionStatusEnum.SCHEDULED;
    }

    if (transactionDay < today) {
      return TransactionStatusEnum.OVERDUE;
    }

    return TransactionStatusEnum.SCHEDULED;
  }
}
