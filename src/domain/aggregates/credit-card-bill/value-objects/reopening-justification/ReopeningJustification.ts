import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidReopeningJustificationError } from '../../errors/InvalidReopeningJustificationError';

export type ReopeningJustificationValue = { justification: string };

export class ReopeningJustification
  implements IValueObject<ReopeningJustificationValue>
{
  private either = new Either<DomainError, ReopeningJustificationValue>();

  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 500;

  private constructor(private _justification: string) {
    this.validate();
  }

  get value(): ReopeningJustificationValue | null {
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
      vo instanceof ReopeningJustification &&
      vo.value?.justification === this.value?.justification
    );
  }

  static create(text: string): ReopeningJustification {
    return new ReopeningJustification(text);
  }

  private validate() {
    const trimmed = this._justification?.trim();
    if (!trimmed || trimmed.length < ReopeningJustification.MIN_LENGTH) {
      this.either.addError(new InvalidReopeningJustificationError());
    }
    if (trimmed && trimmed.length > ReopeningJustification.MAX_LENGTH) {
      this.either.addError(new InvalidReopeningJustificationError());
    }
    this.either.setData({ justification: trimmed });
  }
}
