import { Either } from '@either';

import { DomainError } from '../../../../shared/DomainError';
import { IValueObject } from '../../../../shared/IValueObject';
import { InvalidFrequencyConfigurationError } from '../../errors/InvalidFrequencyConfigurationError';
import { FrequencyType } from '../../enums/FrequencyType';

export type ContributionFrequencyValue = {
  type: FrequencyType;
  executionDay: number;
  interval: number;
  nextExecutionDate: Date;
};

export type ContributionFrequencyProps = {
  type: FrequencyType;
  executionDay: number;
  interval: number;
  startDate: Date;
};

export class ContributionFrequency
  implements IValueObject<ContributionFrequencyValue>
{
  private either = new Either<DomainError, ContributionFrequencyValue>();

  private constructor(private props: ContributionFrequencyProps) {
    this.validate();
  }

  get value(): ContributionFrequencyValue | null {
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
      vo instanceof ContributionFrequency &&
      vo.value?.type === this.value?.type &&
      vo.value?.executionDay === this.value?.executionDay &&
      vo.value?.interval === this.value?.interval
    );
  }

  static create(props: ContributionFrequencyProps): ContributionFrequency {
    return new ContributionFrequency(props);
  }

  private validate() {
    if (!Object.values(FrequencyType).includes(this.props.type)) {
      this.either.addError(new InvalidFrequencyConfigurationError());
      return;
    }

    if (this.props.interval <= 0) {
      this.either.addError(new InvalidFrequencyConfigurationError());
    }

    if (this.props.type === FrequencyType.WEEKLY) {
      if (this.props.executionDay < 1 || this.props.executionDay > 7) {
        this.either.addError(new InvalidFrequencyConfigurationError());
      }
    } else {
      if (this.props.executionDay < 1 || this.props.executionDay > 31) {
        this.either.addError(new InvalidFrequencyConfigurationError());
      }
    }

    const nextDate = this.calculateNextDate();
    if (!this.either.hasError) {
      this.either.setData({
        type: this.props.type,
        executionDay: this.props.executionDay,
        interval: this.props.interval,
        nextExecutionDate: nextDate,
      });
    }
  }

  private calculateNextDate(): Date {
    const start = new Date(this.props.startDate);
    if (this.props.type === FrequencyType.WEEKLY) {
      const desired = this.props.executionDay % 7; // 1-7 => 1-7 with 7->0
      const day = start.getDay() === 0 ? 7 : start.getDay();
      const diff = (desired - day + 7) % 7;
      start.setDate(start.getDate() + diff);
    } else if (this.props.type === FrequencyType.MONTHLY) {
      start.setDate(this.props.executionDay);
      if (start < this.props.startDate) {
        start.setMonth(start.getMonth() + this.props.interval);
      }
    } else if (this.props.type === FrequencyType.YEARLY) {
      start.setDate(this.props.executionDay);
      if (start < this.props.startDate) {
        start.setFullYear(start.getFullYear() + this.props.interval);
      }
    }
    return start;
  }
}
