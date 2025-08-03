import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidReconciliationJustificationError } from '../../errors/InvalidReconciliationJustificationError';

export type ReconciliationJustificationValue = {
  justification: string;
};

export class ReconciliationJustification implements IValueObject<ReconciliationJustificationValue> {
  private either = new Either<DomainError, ReconciliationJustificationValue>();

  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 500;

  private constructor(private _justification: string) {
    this.validate();
  }

  get value(): ReconciliationJustificationValue | null {
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
      vo instanceof ReconciliationJustification &&
      vo.value?.justification === this.value?.justification
    );
  }

  static create(text: string): ReconciliationJustification {
    return new ReconciliationJustification(text);
  }

  private validate() {
    const trimmed = this._justification?.trim();
    if (
      !trimmed ||
      trimmed.length < ReconciliationJustification.MIN_LENGTH ||
      trimmed.length > ReconciliationJustification.MAX_LENGTH
    ) {
      this.either.addError(
        new InvalidReconciliationJustificationError(this._justification),
      );
    }

    this.either.setData({ justification: this._justification });
  }
}
