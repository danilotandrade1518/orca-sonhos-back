import { Either } from '@either';

import { DomainError } from '../../../../shared/domain-error';
import { IValueObject } from '../../../../shared/value-object';
import { InvalidBillStatusError } from '../../errors/InvalidBillStatusError';

export enum BillStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export type BillStatusValue = {
  status: BillStatusEnum;
};

export class BillStatus implements IValueObject<BillStatusValue> {
  private either = new Either<DomainError, BillStatusValue>();

  private constructor(private _status: BillStatusEnum) {
    this.validate();
  }

  get value(): BillStatusValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof BillStatus && vo.value?.status === this.value?.status;
  }

  static create(status: BillStatusEnum): BillStatus {
    return new BillStatus(status);
  }

  private validate() {
    if (!this._status)
      this.either.addError(new InvalidBillStatusError(this._status));

    this.either.setData({ status: this._status });
  }
}
