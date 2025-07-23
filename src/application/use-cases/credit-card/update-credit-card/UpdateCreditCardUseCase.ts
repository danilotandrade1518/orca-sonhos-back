import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetCreditCardRepository } from '../../../contracts/repositories/credit-card/IGetCreditCardRepository';
import { ISaveCreditCardRepository } from '../../../contracts/repositories/credit-card/ISaveCreditCardRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { CreditCardNotFoundError } from '../../../shared/errors/CreditCardNotFoundError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { UpdateCreditCardDto } from './UpdateCreditCardDto';

export class UpdateCreditCardUseCase implements IUseCase<UpdateCreditCardDto> {
  constructor(
    private readonly getCreditCardRepository: IGetCreditCardRepository,
    private readonly saveCreditCardRepository: ISaveCreditCardRepository,
  ) {}

  async execute(dto: UpdateCreditCardDto) {
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

    const updateResult = creditCard.update({
      name: dto.name,
      limit: dto.limit,
      closingDay: dto.closingDay,
      dueDay: dto.dueDay,
    });

    if (updateResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(updateResult.errors);

    const persistResult =
      await this.saveCreditCardRepository.execute(creditCard);

    if (persistResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        persistResult.errors,
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: creditCard.id,
    });
  }
}
