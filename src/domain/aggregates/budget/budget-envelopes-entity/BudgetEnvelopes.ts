import { NotFoundError } from '@domain/shared/errors/NotFoundError';
import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
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
    const envelopeOrError = Envelope.create(data);

    if (envelopeOrError.hasError)
      return Either.errors<DomainError, void>(envelopeOrError.errors);

    this._envelopes.push(envelopeOrError.data!);
    return Either.success<DomainError, void>();
  }

  removeEnvelope(envelopeId: string): Either<DomainError, void> {
    const index = this._envelopes.findIndex((e) => e.id === envelopeId);
    if (index === -1)
      return Either.error<DomainError, void>(new NotFoundError('envelopeId'));

    this._envelopes.splice(index, 1);
    return Either.success<DomainError, void>();
  }

  static create(
    data: CreateBudgetEnvelopesDTO,
  ): Either<DomainError, BudgetEnvelopes> {
    const envelopes: Envelope[] = [];
    for (const envelope of data.envelopes) {
      const envelopeOrError = Envelope.create(envelope);

      if (envelopeOrError.hasError)
        return Either.errors<DomainError, BudgetEnvelopes>(
          envelopeOrError.errors,
        );

      envelopes.push(envelopeOrError.data!);
    }

    return Either.success<DomainError, BudgetEnvelopes>(
      new BudgetEnvelopes(envelopes),
    );
  }
}
