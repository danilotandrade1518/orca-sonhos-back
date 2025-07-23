import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetCreditCardRepository } from '../../../contracts/repositories/credit-card/IGetCreditCardRepository';
import { IDeleteCreditCardRepository } from '../../../contracts/repositories/credit-card/IDeleteCreditCardRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { CreditCardNotFoundError } from '../../../shared/errors/CreditCardNotFoundError';
import { CreditCardDeletionFailedError } from '../../../shared/errors/CreditCardDeletionFailedError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { DeleteCreditCardDto } from './DeleteCreditCardDto';

export class DeleteCreditCardUseCase implements IUseCase<DeleteCreditCardDto> {
  constructor(
    private readonly getCreditCardRepository: IGetCreditCardRepository,
    private readonly deleteCreditCardRepository: IDeleteCreditCardRepository,
  ) {}

  async execute(dto: DeleteCreditCardDto) {
    const creditCardResult = await this.getCreditCardRepository.execute(dto.id);

    if (creditCardResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        creditCardResult.errors,
      );
    }

    const creditCard = creditCardResult.data;
    if (!creditCard) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new CreditCardNotFoundError(),
      );
    }

    const deleteResult = creditCard.delete();

    if (deleteResult.hasError) {
      return Either.errors<DomainError, UseCaseResponse>(deleteResult.errors);
    }

    const persistResult = await this.deleteCreditCardRepository.execute(
      creditCard.id,
    );

    if (persistResult.hasError) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new CreditCardDeletionFailedError(),
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: creditCard.id,
    });
  }
}
