import { PayCreditCardBillDomainService } from '@domain/aggregates/credit-card-bill/services/PayCreditCardBillDomainService';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IGetCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IPayCreditCardBillUnitOfWork } from '../../../contracts/unit-of-works/IPayCreditCardBillUnitOfWork';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { PayCreditCardBillDto } from './PayCreditCardBillDto';

export class PayCreditCardBillUseCase
  implements IUseCase<PayCreditCardBillDto>
{
  private readonly payCreditCardBillDomainService: PayCreditCardBillDomainService;

  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly payUnitOfWork: IPayCreditCardBillUnitOfWork,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {
    this.payCreditCardBillDomainService = new PayCreditCardBillDomainService();
  }

  async execute(
    dto: PayCreditCardBillDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new InsufficientPermissionsError(),
      );
    }

    const billResult = await this.getCreditCardBillRepository.execute(
      dto.creditCardBillId,
    );

    if (billResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        billResult.errors,
      );
    }

    const bill = billResult.data;
    if (!bill) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CreditCardBillNotFoundError(),
      );
    }

    const accountResult = await this.getAccountRepository.execute(
      dto.accountId,
    );

    if (accountResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        accountResult.errors,
      );
    }

    const account = accountResult.data;
    if (!account) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new AccountNotFoundError(),
      );
    }

    const paymentOperationResult =
      this.payCreditCardBillDomainService.createPaymentOperation(
        bill,
        account,
        dto.budgetId,
        dto.amount,
        dto.userId,
        dto.paidAt || new Date(),
        dto.paymentCategoryId,
      );

    if (paymentOperationResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        paymentOperationResult.errors,
      );
    }

    const { debitTransaction, billPaidEvent } = paymentOperationResult.data!;

    const unitOfWorkResult = await this.payUnitOfWork.executePayment({
      debitTransaction,
      bill,
      billPaidEvent,
    });

    if (unitOfWorkResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        unitOfWorkResult.errors,
      );
    }

    try {
      await this.eventPublisher.publish(billPaidEvent);
    } catch (error) {
      console.error('Failed to publish domain event:', error);
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: bill.id,
    });
  }
}
