import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { ContributionSource } from './ContributionSource';
import { InvalidContributionSourceError } from '../errors/InvalidContributionSourceError';

export interface EnvelopeContributionProps {
  amount: number;
  source: ContributionSource;
  description?: string;
  contributedAt?: Date;
  contributionId?: string;
}

export interface EnvelopeContributionValue {
  amount: number;
  source: ContributionSource;
  description?: string;
  contributedAt: Date;
  contributionId: string;
}

export class EnvelopeContribution {
  private readonly either = new Either<
    DomainError,
    EnvelopeContributionValue
  >();

  private constructor(private readonly props: EnvelopeContributionProps) {
    this.validate();
  }

  static create(props: EnvelopeContributionProps): EnvelopeContribution {
    return new EnvelopeContribution(props);
  }

  get value(): EnvelopeContributionValue | null {
    return this.either.data ?? null;
  }

  get hasError(): boolean {
    return this.either.hasError;
  }

  get errors(): DomainError[] {
    return this.either.errors;
  }

  private validate(): void {
    const amountVo = MoneyVo.create(this.props.amount);
    const idVo = this.props.contributionId
      ? EntityId.fromString(this.props.contributionId)
      : EntityId.create();

    if (amountVo.hasError) this.either.addManyErrors(amountVo.errors);
    if (idVo.hasError) this.either.addManyErrors(idVo.errors);

    if (!Object.values(ContributionSource).includes(this.props.source)) {
      this.either.addError(new InvalidContributionSourceError());
    }

    if (this.either.hasError) return;

    this.either.setData({
      amount: amountVo.value!.cents,
      source: this.props.source,
      description: this.props.description,
      contributedAt: this.props.contributedAt ?? new Date(),
      contributionId: idVo.value!.id,
    });
  }
}
