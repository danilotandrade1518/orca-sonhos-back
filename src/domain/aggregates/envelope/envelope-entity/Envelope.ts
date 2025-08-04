import { Either } from '@either';

import { AggregateRoot } from '../../../shared/AggregateRoot';
import { DomainError } from '../../../shared/DomainError';
import { IEntity } from '../../../shared/IEntity';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EntityName } from '../../../shared/value-objects/entity-name/EntityName';
import { MoneyVo } from '../../../shared/value-objects/money-vo/MoneyVo';
import { EnvelopeAlreadyDeletedError } from '../errors/EnvelopeAlreadyDeletedError';
import { EnvelopeHasBalanceError } from '../errors/EnvelopeHasBalanceError';
import { EnvelopeHasPendingContributionsError } from '../errors/EnvelopeHasPendingContributionsError';
import { EnvelopeHasTransactionsError } from '../errors/EnvelopeHasTransactionsError';
import { InactiveEnvelopeError } from '../errors/InactiveEnvelopeError';
import { EnvelopeContributionMadeEvent } from '../events/EnvelopeContributionMadeEvent';
import { EnvelopeDeactivatedEvent } from '../events/EnvelopeDeactivatedEvent';
import { EnvelopeDeletedEvent } from '../events/EnvelopeDeletedEvent';
import { ContributionSource } from '../value-objects/ContributionSource';
import { EnvelopeContribution } from '../value-objects/EnvelopeContribution';
import { EnvelopeStatus } from './EnvelopeStatus';

export interface RestoreEnvelopeDTO {
  id: string;
  name: string;
  budgetId: string;
  balance: number;
  status: EnvelopeStatus;
  createdAt: Date;
  updatedAt: Date;
  hasPendingContributions?: boolean;
  hasTransactions?: boolean;
}

export interface CreateEnvelopeDTO {
  budgetId: string;
  name: string;
  balance: number;
}

export class Envelope extends AggregateRoot implements IEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _isDeleted = false;
  private _balance: MoneyVo;
  private _status: EnvelopeStatus = EnvelopeStatus.ACTIVE;
  private _hasTransactions = false;
  private _hasPendingContributions = false;
  private readonly _budgetId: EntityId;
  private _name: EntityName;
  private _contributions: EnvelopeContribution[] = [];

  private constructor(
    budgetId: EntityId,
    name: EntityName,
    balance: MoneyVo,
    status?: EnvelopeStatus,
    existingId?: EntityId,
  ) {
    super();
    this._id = existingId || EntityId.create();
    this._name = name;
    this._budgetId = budgetId;
    this._balance = balance;
    this._status = status || EnvelopeStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value?.id ?? '';
  }
  get name(): string {
    return this._name.value?.name ?? '';
  }
  get budgetId(): string {
    return this._budgetId.value?.id ?? '';
  }
  get balance(): number {
    return this._balance.value?.cents ?? 0;
  }
  get status(): EnvelopeStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get isDeleted(): boolean {
    return this._isDeleted;
  }
  get contributions(): EnvelopeContribution[] {
    return this._contributions;
  }

  setHasTransactions(value: boolean): void {
    this._hasTransactions = value;
  }

  setHasPendingContributions(value: boolean): void {
    this._hasPendingContributions = value;
  }

  delete(): Either<DomainError, void> {
    if (this._isDeleted)
      return Either.error<DomainError, void>(new EnvelopeAlreadyDeletedError());

    if (this.balance !== 0)
      return Either.error<DomainError, void>(new EnvelopeHasBalanceError());

    if (this._hasTransactions)
      return Either.error<DomainError, void>(
        new EnvelopeHasTransactionsError(),
      );

    if (this._hasPendingContributions)
      return Either.error<DomainError, void>(
        new EnvelopeHasPendingContributionsError(),
      );

    this._isDeleted = true;
    this._updatedAt = new Date();
    this.addEvent(new EnvelopeDeletedEvent(this.id, this.budgetId, this.name));
    return Either.success();
  }

  deactivate(): Either<DomainError, void> {
    if (this._status === EnvelopeStatus.INACTIVE) {
      return Either.success();
    }
    this._status = EnvelopeStatus.INACTIVE;
    this._updatedAt = new Date();
    this.addEvent(
      new EnvelopeDeactivatedEvent(this.id, this.budgetId, this.name),
    );
    return Either.success();
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
    const balanceVo = MoneyVo.create(data.balance);

    const either = new Either<DomainError, Envelope>();

    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);
    if (balanceVo.hasError) either.addManyErrors(balanceVo.errors);

    if (either.hasError) return either;

    const envelope = new Envelope(budgetIdVo, nameVo, balanceVo);
    either.setData(envelope);
    return either;
  }

  static restore(data: RestoreEnvelopeDTO): Either<DomainError, Envelope> {
    const either = new Either<DomainError, Envelope>();

    const idVo = EntityId.fromString(data.id);
    const nameVo = EntityName.create(data.name);
    const budgetIdVo = EntityId.fromString(data.budgetId);
    const balanceVo = MoneyVo.create(data.balance);

    if (idVo.hasError) either.addManyErrors(idVo.errors);
    if (nameVo.hasError) either.addManyErrors(nameVo.errors);
    if (budgetIdVo.hasError) either.addManyErrors(budgetIdVo.errors);
    if (balanceVo.hasError) either.addManyErrors(balanceVo.errors);

    if (either.hasError) return either;

    const envelope = new Envelope(
      budgetIdVo,
      nameVo,
      balanceVo,
      data.status,
      idVo,
    );

    Object.defineProperty(envelope, '_createdAt', {
      value: data.createdAt,
      writable: false,
    });
    envelope._updatedAt = data.updatedAt;
    envelope._isDeleted = false;
    envelope._hasTransactions = data.hasTransactions ?? false;
    envelope._hasPendingContributions = data.hasPendingContributions ?? false;

    either.setData(envelope);
    return either;
  }
}
