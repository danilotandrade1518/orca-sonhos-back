import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IAddCreditCardRepository } from '../../../contracts/repositories/credit-card/IAddCreditCardRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { CreateCreditCardDto } from './CreateCreditCardDto';

export class CreateCreditCardUseCase implements IUseCase<CreateCreditCardDto> {
  constructor(
    private readonly addCreditCardRepository: IAddCreditCardRepository,
  ) {}

  async execute(dto: CreateCreditCardDto) {
    const creditCardResult = CreditCard.create({
      name: dto.name,
      limit: dto.limit,
      closingDay: dto.closingDay,
      dueDay: dto.dueDay,
      budgetId: dto.budgetId,
    });

    if (creditCardResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(
        creditCardResult.errors,
      );

    const creditCard = creditCardResult.data!;

    const persistResult =
      await this.addCreditCardRepository.execute(creditCard);

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
