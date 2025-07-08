import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidTransactionDescriptionError } from '../../errors/InvalidTransactionDescriptionError';

export type TransactionDescriptionValue = {
  description: string;
};

export class TransactionDescription
  implements IValueObject<TransactionDescriptionValue>
{
  private either = new Either<DomainError, TransactionDescriptionValue>();

  private constructor(private _description: string) {
    this.validate();
  }

  get value(): TransactionDescriptionValue | null {
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
      vo instanceof TransactionDescription &&
      vo.value?.description === this.value?.description
    );
  }

  static create(description: string): TransactionDescription {
    return new TransactionDescription(description);
  }

  private validate() {
    const trimmedDescription = this._description?.trim();

    if (
      !trimmedDescription ||
      trimmedDescription.length < 3 ||
      trimmedDescription.length > 100
    )
      this.either.addError(new InvalidTransactionDescriptionError());

    this.either.setData({ description: trimmedDescription });
  }
}
