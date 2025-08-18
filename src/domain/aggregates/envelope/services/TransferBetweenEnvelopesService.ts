import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { Envelope } from '../envelope-entity/Envelope';

class EnvelopesMustBelongToSameBudgetError extends DomainError {
  constructor() {
    super('Envelopes must belong to the same budget');
  }
}

class InvalidTransferAmountError extends DomainError {
  constructor() {
    super('Invalid transfer amount');
  }
}

export class TransferBetweenEnvelopesService {
  createTransferOperation(
    sourceEnvelope: Envelope,
    targetEnvelope: Envelope,
    amount: number,
    budgetId: string,
  ): Either<
    DomainError,
    { sourceEnvelope: Envelope; targetEnvelope: Envelope }
  > {
    if (
      sourceEnvelope.budgetId !== budgetId ||
      targetEnvelope.budgetId !== budgetId ||
      sourceEnvelope.budgetId !== targetEnvelope.budgetId
    ) {
      return Either.error(new EnvelopesMustBelongToSameBudgetError());
    }

    if (amount <= 0) {
      return Either.error(new InvalidTransferAmountError());
    }

    const removeResult = sourceEnvelope.removeAmount(amount);
    if (removeResult.hasError) {
      return Either.errors(removeResult.errors);
    }

    const addResult = targetEnvelope.addAmount(amount);
    if (addResult.hasError) {
      return Either.errors(addResult.errors);
    }

    return Either.success({ sourceEnvelope, targetEnvelope });
  }
}
