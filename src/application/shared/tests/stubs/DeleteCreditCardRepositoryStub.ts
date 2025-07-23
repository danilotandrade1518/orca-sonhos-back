import { Either } from '@either';

import { IDeleteCreditCardRepository } from '../../../contracts/repositories/credit-card/IDeleteCreditCardRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteCreditCardRepositoryStub
  implements IDeleteCreditCardRepository
{
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(creditCardId: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(creditCardId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
