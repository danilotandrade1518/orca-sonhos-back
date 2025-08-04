import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { EntityId } from '../../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../../shared/value-objects/money-vo/MoneyVo';
import { InvalidContributionAmountError } from '../../errors/InvalidContributionAmountError';
import { InvalidStartDateError } from '../../errors/InvalidStartDateError';
import { ContributionFrequency } from '../contribution-frequency/ContributionFrequency';

export type AutomaticContributionValue = {
  amount: number;
  frequency: ContributionFrequency;
  sourceAccountId: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
};

export type AutomaticContributionProps = {
  amount: number;
  frequency: ContributionFrequency;
  sourceAccountId: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
};

export class AutomaticContribution
  implements IValueObject<AutomaticContributionValue>
{
  private either = new Either<DomainError, AutomaticContributionValue>();

  private constructor(private props: AutomaticContributionProps) {
    this.validate();
  }

  get value(): AutomaticContributionValue | null {
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
      vo instanceof AutomaticContribution &&
      !!vo.value &&
      !!this.value &&
      vo.value.amount === this.value.amount &&
      vo.value.frequency.equals(this.props.frequency) &&
      vo.value.sourceAccountId === this.value.sourceAccountId
    );
  }

  static create(props: AutomaticContributionProps): AutomaticContribution {
    return new AutomaticContribution(props);
  }

  private validate() {
    const amountVo = MoneyVo.create(this.props.amount);
    if (amountVo.hasError || (amountVo.value?.cents ?? 0) <= 0) {
      this.either.addError(new InvalidContributionAmountError());
    }

    if (this.props.frequency.hasError) {
      this.either.addManyErrors(this.props.frequency.errors);
    }

    const sourceId = EntityId.fromString(this.props.sourceAccountId);
    if (sourceId.hasError) this.either.addManyErrors(sourceId.errors);

    const now = new Date();
    if (this.props.startDate.getTime() < now.getTime()) {
      this.either.addError(new InvalidStartDateError());
    }

    if (!this.either.hasError) {
      this.either.setData({
        amount: amountVo.value!.cents,
        frequency: this.props.frequency,
        sourceAccountId: sourceId.value!.id,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        isActive: this.props.isActive,
      });
    }
  }
}
