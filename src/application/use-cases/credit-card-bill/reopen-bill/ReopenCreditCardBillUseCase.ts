import { Either } from '@either';
import { IUseCase, UseCaseResponse } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IReopenCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IReopenCreditCardBillRepository';
import { IGetCreditCardRepository } from '@application/contracts/repositories/credit-card/IGetCreditCardRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { DomainError } from '@domain/shared/DomainError';
import { ReopeningJustification } from '@domain/aggregates/credit-card-bill/value-objects/reopening-justification/ReopeningJustification';
import { ReopenCreditCardBillDto } from './ReopenCreditCardBillDto';

export class ReopenCreditCardBillUseCase
  implements IUseCase<ReopenCreditCardBillDto>
{
  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly reopenCreditCardBillRepository: IReopenCreditCardBillRepository,
    private readonly getCreditCardRepository: IGetCreditCardRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: ReopenCreditCardBillDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const billResult = await this.getCreditCardBillRepository.execute(
      dto.creditCardBillId,
    );

    if (billResult.hasError) return Either.errors(billResult.errors);

    const bill = billResult.data;
    if (!bill) return Either.error(new CreditCardBillNotFoundError());

    const cardResult = await this.getCreditCardRepository.execute(
      bill.creditCardId,
    );
    if (cardResult.hasError) return Either.errors(cardResult.errors);
    const card = cardResult.data;
    if (!card) return Either.error(new CreditCardBillNotFoundError());

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      card.budgetId,
    );
    if (auth.hasError) return Either.errors(auth.errors);
    if (!auth.data) return Either.error(new InsufficientPermissionsError());

    const justificationVo = ReopeningJustification.create(dto.justification);
    if (justificationVo.hasError) return Either.errors(justificationVo.errors);

    const reopenResult = bill.reopen(justificationVo);
    if (reopenResult.hasError) return Either.errors(reopenResult.errors);

    const saveResult = await this.reopenCreditCardBillRepository.execute(bill);
    if (saveResult.hasError) return Either.errors(saveResult.errors);

    return Either.success({ id: bill.id });
  }
}
