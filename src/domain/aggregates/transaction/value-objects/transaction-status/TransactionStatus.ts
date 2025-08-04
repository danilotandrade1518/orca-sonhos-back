import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidTransactionStatusError } from '../../errors/InvalidTransactionStatusError';

export enum TransactionStatusEnum {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  LATE = 'LATE',
}

export type TransactionStatusValue = {
  status: TransactionStatusEnum;
};

export class TransactionStatus implements IValueObject<TransactionStatusValue> {
  private either = new Either<DomainError, TransactionStatusValue>();

  private constructor(private _status: TransactionStatusEnum) {
    this.validate();
  }

  get value(): TransactionStatusValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return (
      vo instanceof TransactionStatus && vo.value?.status === this.value?.status
    );
  }

  static create(status: TransactionStatusEnum): TransactionStatus {
    return new TransactionStatus(status);
  }

  private validate() {
    if (
      !this._status ||
      !Object.values(TransactionStatusEnum).includes(this._status)
    )
      this.either.addError(new InvalidTransactionStatusError());

    this.either.setData({ status: this._status });
  }
}
