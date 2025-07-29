import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidAccountTypeError } from './../../errors/InvalidAccountTypeError';

export enum AccountTypeEnum {
  CHECKING_ACCOUNT = 'CHECKING_ACCOUNT',
  SAVINGS_ACCOUNT = 'SAVINGS_ACCOUNT',
  PHYSICAL_WALLET = 'PHYSICAL_WALLET',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  INVESTMENT_ACCOUNT = 'INVESTMENT_ACCOUNT',
  OTHER = 'OTHER',
}

export type AccountTypeValue = {
  type: AccountTypeEnum;
  allowsNegativeBalance: boolean;
};

export class AccountType implements IValueObject<AccountTypeValue> {
  private either = new Either<DomainError, AccountTypeValue>();

  private constructor(private _type: AccountTypeEnum) {
    this.validate();
  }

  get value(): AccountTypeValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  equals(vo: this): boolean {
    return vo instanceof AccountType && vo.value?.type === this.value?.type;
  }

  static create(type: AccountTypeEnum): AccountType {
    return new AccountType(type);
  }

  private validate() {
    if (!this._type || !Object.values(AccountTypeEnum).includes(this._type)) {
      this.either.addError(new InvalidAccountTypeError());
      return;
    }

    const allowsNegativeBalance = this.getAllowsNegativeBalance(this._type);
    this.either.setData({
      type: this._type,
      allowsNegativeBalance,
    });
  }

  private getAllowsNegativeBalance(type: AccountTypeEnum): boolean {
    switch (type) {
      case AccountTypeEnum.CHECKING_ACCOUNT:
        return true;
      case AccountTypeEnum.SAVINGS_ACCOUNT:
      case AccountTypeEnum.PHYSICAL_WALLET:
      case AccountTypeEnum.DIGITAL_WALLET:
      case AccountTypeEnum.INVESTMENT_ACCOUNT:
      case AccountTypeEnum.OTHER:
        return false;
      default:
        return false;
    }
  }
}
