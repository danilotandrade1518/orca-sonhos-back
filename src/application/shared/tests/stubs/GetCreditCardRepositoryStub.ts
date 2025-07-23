import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';

import { IGetCreditCardRepository } from '../../../contracts/repositories/credit-card/IGetCreditCardRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetCreditCardRepositoryStub implements IGetCreditCardRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public executeCalls: string[] = [];
  private creditCards: Record<string, CreditCard> = {};
  private _mockCreditCard: CreditCard | null = null;

  set mockCreditCard(creditCard: CreditCard | null) {
    this._mockCreditCard = creditCard;
    if (creditCard) {
      this.creditCards[creditCard.id] = creditCard;
    } else {
      this.creditCards = {};
    }
  }

  setCreditCard(creditCard: CreditCard | null) {
    this.mockCreditCard = creditCard;
  }

  async execute(
    creditCardId: string,
  ): Promise<Either<RepositoryError, CreditCard | null>> {
    this.executeCalls.push(creditCardId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    const creditCard = this.creditCards[creditCardId] || this._mockCreditCard;
    return Either.success(creditCard);
  }
}
