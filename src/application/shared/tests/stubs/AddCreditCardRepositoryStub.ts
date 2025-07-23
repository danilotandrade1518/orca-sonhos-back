import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';

import { IAddCreditCardRepository } from '../../../contracts/repositories/credit-card/IAddCreditCardRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class AddCreditCardRepositoryStub implements IAddCreditCardRepository {
  public shouldFail = false;
  public executeCalls: CreditCard[] = [];

  async execute(
    creditCard: CreditCard,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(creditCard);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
