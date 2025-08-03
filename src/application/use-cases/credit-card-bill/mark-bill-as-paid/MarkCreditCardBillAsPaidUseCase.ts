import { Either } from '@either';
import { IUseCase, UseCaseResponse } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { AccountNotFoundError } from '@application/shared/errors/AccountNotFoundError';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBillPaymentFailedError } from '@application/shared/errors/CreditCardBillPaymentFailedError';
import { CreditCardBillAlreadyPaidError } from '@domain/aggregates/credit-card-bill/errors/CreditCardBillAlreadyPaidError';
import { InsufficientBalanceError } from '@domain/aggregates/account/errors/InsufficientBalanceError';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { IMarkCreditCardBillAsPaidRepository } from '@application/contracts/repositories/credit-card-bill/IMarkCreditCardBillAsPaidRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { IEventPublisher } from '@application/contracts/events/IEventPublisher';
import { DomainError } from '@domain/shared/DomainError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { MarkCreditCardBillAsPaidDto } from './MarkCreditCardBillAsPaidDto';

export class MarkCreditCardBillAsPaidUseCase
  implements IUseCase<MarkCreditCardBillAsPaidDto>
{
  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly markCreditCardBillAsPaidRepository: IMarkCreditCardBillAsPaidRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
    private readonly paymentCategoryId: string,
  ) {}

  async execute(
    dto: MarkCreditCardBillAsPaidDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.errors([new InsufficientPermissionsError()]);
    }

    const billResult = await this.getCreditCardBillRepository.execute(
      dto.creditCardBillId,
    );

    if (billResult.hasError) {
      const error = billResult.errors[0] as RepositoryError;
      return Either.error(new CreditCardBillPaymentFailedError(error.message));
    }

    const bill = billResult.data;
    if (!bill) {
      return Either.error(new CreditCardBillNotFoundError());
    }

    if (bill.status !== BillStatusEnum.OPEN) {
      return Either.error(new CreditCardBillAlreadyPaidError());
    }

    const accountResult = await this.getAccountRepository.execute(
      dto.sourceAccountId,
    );

    if (accountResult.hasError) {
      const error = accountResult.errors[0] as RepositoryError;
      return Either.error(new CreditCardBillPaymentFailedError(error.message));
    }

    const account = accountResult.data;
    if (!account) {
      return Either.error(new AccountNotFoundError());
    }

    if (!account.canSubtract(dto.paymentAmount)) {
      return Either.errors([new InsufficientBalanceError()]);
    }

    const markResult = bill.markAsPaid(dto.paymentAmount, dto.paymentDate);
    if (markResult.hasError) {
      return Either.errors(markResult.errors);
    }

    const subtractResult = account.subtractAmount(dto.paymentAmount);
    if (subtractResult.hasError) {
      return Either.errors(subtractResult.errors);
    }

    const transactionResult = Transaction.create({
      description:
        dto.description || 'Pagamento fatura cartão',
      amount: dto.paymentAmount,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: dto.paymentDate,
      categoryId: this.paymentCategoryId,
      budgetId: dto.budgetId,
      accountId: dto.sourceAccountId,
    });

    if (transactionResult.hasError) {
      return Either.errors(transactionResult.errors);
    }

    const transaction = transactionResult.data!;

    const repoResult = await this.markCreditCardBillAsPaidRepository.execute({
      creditCardBill: bill,
      account,
      transaction,
    });

    if (repoResult.hasError) {
      const error = repoResult.errors[0] as RepositoryError;
      return Either.error(new CreditCardBillPaymentFailedError(error.message));
    }

    const events = [...bill.getEvents(), ...transaction.getEvents()];
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        bill.clearEvents();
        transaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish domain events:', error);
      }
    }

    return Either.success({ id: bill.id });
  }
}
