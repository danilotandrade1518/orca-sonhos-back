import { NotFoundError } from '@domain/shared/errors/NotFoundError';
import { Either } from '@either';

import { DomainError } from '../../../shared/domain-error';
import { Envelope } from '../envelope-entity/Envelope';

export interface CreateBudgetEnvelopesDTO {
  envelopes: {
    name: string;
    limit: number;
    categoryId: string;
  }[];
}

export class BudgetEnvelopes {
  private _envelopes: Envelope[];

  private constructor(envelopes: Envelope[]) {
    this._envelopes = envelopes;
  }

  get envelopes(): Envelope[] {
    return this._envelopes;
  }

  addEnvelope(data: {
    name: string;
    limit: number;
    categoryId: string;
  }): Either<DomainError, void> {
    const either = new Either<DomainError, void>();
    const envelopeOrError = Envelope.create(data);
    if (envelopeOrError.hasError) {
      either.addManyErrors(envelopeOrError.errors);
      return either;
    }
    this._envelopes.push(envelopeOrError.data!);
    return either;
  }

  removeEnvelope(envelopeId: string): Either<DomainError, void> {
    const either = new Either<DomainError, void>();
    const index = this._envelopes.findIndex((e) => e.id === envelopeId);
    if (index === -1) {
      either.addError(new NotFoundError('envelopeId'));
      return either;
    }
    this._envelopes.splice(index, 1);
    return either;
  }

  static create(
    data: CreateBudgetEnvelopesDTO,
  ): Either<DomainError, BudgetEnvelopes> {
    const either = new Either<DomainError, BudgetEnvelopes>();
    const envelopes: Envelope[] = [];
    for (const env of data.envelopes) {
      const envOrError = Envelope.create(env);
      if (envOrError.hasError) {
        either.addManyErrors(envOrError.errors);
      } else {
        envelopes.push(envOrError.data!);
      }
    }
    if (either.hasError) return either;
    either.setData(new BudgetEnvelopes(envelopes));
    return either;
  }
}
