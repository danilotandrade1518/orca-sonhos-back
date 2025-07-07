import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { InvalidCreditCardBillDateError } from '../errors/InvalidCreditCardBillDateError';
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

export class CreditCardBill {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;

  private _updatedAt: Date;
  private _paidAt?: Date;

  private constructor(
    private _creditCardId: EntityId,
    private _closingDate: Date,
    private _dueDate: Date,
    private _amount: MoneyVo,
    private _status: BillStatus,
  ) {
    this._id = EntityId.create();
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

  get isOverdue(): boolean {
    const today = new Date();
    return this._dueDate < today && this.status !== BillStatusEnum.PAID;
  }

  get daysToDue(): number {
    const today = new Date();
    const diffTime = this._dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  markAsPaid(): Either<DomainError, void> {
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
}
