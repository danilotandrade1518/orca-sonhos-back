import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { IEntity } from '../../../shared/entity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { TransactionBusinessRuleError } from '../errors/TransactionBusinessRuleError';
import { TransactionDescription } from '../value-objects/transaction-description/TransactionDescription';
import {
  TransactionStatus,
  TransactionStatusEnum,
} from '../value-objects/transaction-status/TransactionStatus';
import {
  TransactionType,
  TransactionTypeEnum,
} from '../value-objects/transaction-type/TransactionType';

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  type: TransactionTypeEnum;
  transactionDate: Date;
  categoryId: string;
  budgetId: string;
  status?: TransactionStatusEnum;
  creditCardId?: string;
}

export class Transaction implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;

  private constructor(
    private readonly _description: TransactionDescription,
    private readonly _amount: MoneyVo,
    private readonly _type: TransactionType,
    private readonly _transactionDate: Date,
    private readonly _categoryId: EntityId,
    private readonly _budgetId: EntityId,
    private _status: TransactionStatus,
    private readonly _creditCardId?: EntityId,
  ) {
    this._id = EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
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

  complete(): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    if (this.isCancelled) {
      either.addError(
        new TransactionBusinessRuleError(
          'Cannot complete a cancelled transaction',
        ),
      );
      return either;
    }

    this._status = TransactionStatus.create(TransactionStatusEnum.COMPLETED);
    this._updatedAt = new Date();

    either.setData(undefined);
    return either;
  }

  cancel(): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    if (this.isCompleted) {
      either.addError(
        new TransactionBusinessRuleError(
          'Cannot cancel a completed transaction',
        ),
      );
      return either;
    }

    this._status = TransactionStatus.create(TransactionStatusEnum.CANCELLED);
    this._updatedAt = new Date();

    either.setData(undefined);
    return either;
  }

  markAsOverdue(): Either<DomainError, void> {
    const either = new Either<DomainError, void>();

    if (this.isCompleted || this.isCancelled) {
      either.addError(
        new TransactionBusinessRuleError(
          'Cannot mark completed or cancelled transaction as overdue',
        ),
      );
      return either;
    }

    const now = new Date();
    if (this._transactionDate >= now) {
      either.addError(
        new TransactionBusinessRuleError(
          'Cannot mark future transaction as overdue',
        ),
      );
      return either;
    }

    this._status = TransactionStatus.create(TransactionStatusEnum.OVERDUE);
    this._updatedAt = new Date();

    either.setData(undefined);
    return either;
  }

  static create(data: CreateTransactionDTO): Either<DomainError, Transaction> {
    const either = new Either<DomainError, Transaction>();

    const description = TransactionDescription.create(data.description);
    const amount = MoneyVo.create(data.amount);
    const type = TransactionType.create(data.type);
    const categoryId = EntityId.fromString(data.categoryId);
    const budgetId = EntityId.fromString(data.budgetId);

    const status = data.status
      ? TransactionStatus.create(data.status)
      : TransactionStatus.create(
          Transaction.determineInitialStatus(data.transactionDate),
        );

    const creditCardId = data.creditCardId
      ? EntityId.fromString(data.creditCardId)
      : undefined;

    // Validar todos os value objects
    if (description.hasError) either.addManyErrors(description.errors);
    if (amount.hasError) either.addManyErrors(amount.errors);
    if (type.hasError) either.addManyErrors(type.errors);
    if (categoryId.hasError) either.addManyErrors(categoryId.errors);
    if (budgetId.hasError) either.addManyErrors(budgetId.errors);
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
      status,
      creditCardId,
    );

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
