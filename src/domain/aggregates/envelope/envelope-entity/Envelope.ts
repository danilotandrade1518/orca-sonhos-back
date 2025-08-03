import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { EnvelopeContribution } from '../value-objects/EnvelopeContribution';
import { ContributionSource } from '../value-objects/ContributionSource';
import { EnvelopeContributionMadeEvent } from '../events/EnvelopeContributionMadeEvent';
import { EnvelopeStatus } from './EnvelopeStatus';
import { InactiveEnvelopeError } from '../errors/InactiveEnvelopeError';

export interface CreateEnvelopeDTO {
  budgetId: string;
  name: string;
}

export class Envelope extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private _balance: MoneyVo;
  private readonly _budgetId: EntityId;
  private _name: EntityName;
  private _status: EnvelopeStatus = EnvelopeStatus.ACTIVE;
  private _contributions: EnvelopeContribution[] = [];

  private constructor(budgetId: EntityId, name: EntityName) {
    super();
    this._id = EntityId.create();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._budgetId = budgetId;
    this._name = name;
    this._balance = MoneyVo.create(0);
  }

  get id(): string {
    return this._id.value!.id;
  }

  get budgetId(): string {
    return this._budgetId.value!.id;
  }

  get name(): string {
    return this._name.value!.name;
  }

  get balance(): number {
    return this._balance.value!.cents;
  }

  get status(): EnvelopeStatus {
    return this._status;
  }

  get contributions(): EnvelopeContribution[] {
    return this._contributions;
  }

  makeContribution(params: {
    amount: number;
    source: ContributionSource;
    description?: string;
  }): Either<DomainError, EnvelopeContribution> {
    if (this._status !== EnvelopeStatus.ACTIVE) {
      return Either.error(new InactiveEnvelopeError());
    }

    const contribution = EnvelopeContribution.create({
      amount: params.amount,
      source: params.source,
      description: params.description,
    });

    if (contribution.hasError) {
      return Either.errors(contribution.errors);
    }

    const newBalance = MoneyVo.create(this.balance + params.amount);
    if (newBalance.hasError) {
      return Either.errors(newBalance.errors);
    }

    this._balance = newBalance;
    this._updatedAt = new Date();
    this._contributions.push(contribution);

    this.addEvent(
      new EnvelopeContributionMadeEvent(
        this.id,
        params.amount,
        this.balance,
        params.source,
        params.description,
      ),
    );

    return Either.success(contribution);
  }

  static create(data: CreateEnvelopeDTO): Either<DomainError, Envelope> {
    const nameVo = EntityName.create(data.name);
    const budgetIdVo = EntityId.fromString(data.budgetId);
    const either = new Either<DomainError, Envelope>();

    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);

    if (either.hasError) return either;

    const envelope = new Envelope(budgetIdVo, nameVo);
    either.setData(envelope);
    return either;
  }
}
