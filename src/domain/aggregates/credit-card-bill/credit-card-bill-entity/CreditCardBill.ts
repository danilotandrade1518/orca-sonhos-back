import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { CreditCardBillAlreadyDeletedError } from '../errors/CreditCardBillAlreadyDeletedError';
import { CreditCardBillCannotBeUpdatedError } from '../errors/CreditCardBillCannotBeUpdatedError';
import { CreditCardBillNotPaidError } from '../errors/CreditCardBillNotPaidError';
import { InvalidCreditCardBillDateError } from '../errors/InvalidCreditCardBillDateError';
import { ReopeningPeriodExpiredError } from '../errors/ReopeningPeriodExpiredError';
import {
  BillStatus,
  BillStatusEnum,
} from '../value-objects/bill-status/BillStatus';

export interface CreateCreditCardBillDTO {
  creditCardId: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
  status?: BillStatusEnum;
}

export interface UpdateCreditCardBillDTO {
  closingDate: Date;
  dueDate: Date;
  amount: number;
}

export interface RestoreCreditCardBillDTO {
  id: string;
  creditCardId: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
  status: BillStatusEnum;
  paidAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreditCardBill extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _paidAt?: Date;
  private _isDeleted = false;

  private constructor(
    private _creditCardId: EntityId,
    private _closingDate: Date,
    private _dueDate: Date,
    private _amount: MoneyVo,
    private _status: BillStatus,
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

  get creditCardId(): string {
    return this._creditCardId.value?.id ?? '';
  }

  get closingDate(): Date {
    return this._closingDate;
  }

  get dueDate(): Date {
    return this._dueDate;
  }

  get amount(): number {
    return this._amount.value?.cents ?? 0;
  }

  get status(): BillStatusEnum {
    return this._status.value?.status ?? BillStatusEnum.OPEN;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get paidAt(): Date | undefined {
    return this._paidAt;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get isOverdue(): boolean {
    const today = new Date();
    return this._dueDate < today && this.status !== BillStatusEnum.PAID;
  }

  get daysToDue(): number {
    const today = new Date();
    const diffTime = this._dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canBeUpdated(): boolean {
    return !this._isDeleted && this.status !== BillStatusEnum.PAID;
  }

  markAsPaid(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardBillAlreadyDeletedError(),
      );

    if (this.status === BillStatusEnum.PAID)
      return Either.success<DomainError, void>();

    const paidStatus = BillStatus.create(BillStatusEnum.PAID);
    if (paidStatus.hasError)
      return Either.errors<DomainError, void>(paidStatus.errors);

    this._status = paidStatus;
    this._paidAt = new Date();
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  reopen(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardBillAlreadyDeletedError(),
      );

    if (this.status !== BillStatusEnum.PAID)
      return Either.error<DomainError, void>(new CreditCardBillNotPaidError());

    if (!this._paidAt)
      return Either.error<DomainError, void>(new CreditCardBillNotPaidError());

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - this._paidAt.getTime() > thirtyDaysMs)
      return Either.error<DomainError, void>(new ReopeningPeriodExpiredError());

    const openStatus = BillStatus.create(BillStatusEnum.OPEN);
    if (openStatus.hasError)
      return Either.errors<DomainError, void>(openStatus.errors);

    this._status = openStatus;
    this._paidAt = undefined;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  updateAmount(amount: number): Either<DomainError, void> {
    return this.update({
      amount,
      closingDate: this._closingDate,
      dueDate: this._dueDate,
    });
  }

  update(data: UpdateCreditCardBillDTO): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardBillAlreadyDeletedError(),
      );

    if (!this.canBeUpdated())
      return Either.error<DomainError, void>(
        new CreditCardBillCannotBeUpdatedError(),
      );

    const either = new Either<DomainError, void>();

    if (data.closingDate >= data.dueDate)
      either.addError(new InvalidCreditCardBillDateError());

    const amountVo = MoneyVo.create(data.amount);
    if (amountVo.hasError) either.addManyErrors(amountVo.errors);

    if (either.hasError) return either;

    this._closingDate = data.closingDate;
    this._dueDate = data.dueDate;
    this._amount = amountVo;
    this._updatedAt = new Date();

    either.setData();
    return either;
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(
        new CreditCardBillAlreadyDeletedError(),
      );

    this._isDeleted = true;
    this._updatedAt = new Date();

    return Either.success<DomainError, void>();
  }

  static create(
    data: CreateCreditCardBillDTO,
  ): Either<DomainError, CreditCardBill> {
    const either = new Either<DomainError, CreditCardBill>();

    if (data.closingDate >= data.dueDate)
      either.addError(new InvalidCreditCardBillDateError());

    const creditCardId = EntityId.fromString(data.creditCardId);
    if (creditCardId.hasError) either.addManyErrors(creditCardId.errors);

    const amount = MoneyVo.create(data.amount);
    if (amount.hasError) either.addManyErrors(amount.errors);

    const status = BillStatus.create(data.status ?? BillStatusEnum.OPEN);
    if (status.hasError) either.addManyErrors(status.errors);

    if (either.hasError) return either;

    const bill = new CreditCardBill(
      creditCardId,
      data.closingDate,
      data.dueDate,
      amount,
      status,
    );

    return Either.success<DomainError, CreditCardBill>(bill);
  }

  static restore(
    data: RestoreCreditCardBillDTO,
  ): Either<DomainError, CreditCardBill> {
    const either = new Either<DomainError, CreditCardBill>();

    if (data.closingDate >= data.dueDate)
      either.addError(new InvalidCreditCardBillDateError());

    const creditCardId = EntityId.fromString(data.creditCardId);
    if (creditCardId.hasError) either.addManyErrors(creditCardId.errors);

    const amount = MoneyVo.create(data.amount);
    if (amount.hasError) either.addManyErrors(amount.errors);

    const status = BillStatus.create(data.status);
    if (status.hasError) either.addManyErrors(status.errors);

    const idVo = EntityId.fromString(data.id);
    if (idVo.hasError) either.addManyErrors(idVo.errors);

    if (either.hasError) return either;

    const bill = new CreditCardBill(
      creditCardId,
      data.closingDate,
      data.dueDate,
      amount,
      status,
      idVo,
    );

    Object.defineProperty(bill, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    bill._updatedAt = data.updatedAt;
    bill._paidAt = data.paidAt;
    bill._isDeleted = data.isDeleted;

    either.setData(bill);
    return either;
  }
}
