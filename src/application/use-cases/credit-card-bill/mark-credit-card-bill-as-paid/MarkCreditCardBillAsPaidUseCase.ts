import { Either } from '@either';
import { IUseCase } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { AccountNotFoundError } from '@application/shared/errors/AccountNotFoundError';
import { InsufficientBalanceError } from '@domain/aggregates/account/errors/InsufficientBalanceError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';

import { IEventPublisher } from '@application/contracts/events/IEventPublisher';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { IPayCreditCardBillUnitOfWork } from '@application/contracts/unit-of-works/IPayCreditCardBillUnitOfWork';
import { MarkCreditCardBillAsPaidRequestDTO, MarkCreditCardBillAsPaidResponseDTO } from './MarkCreditCardBillAsPaidDTO';

export class MarkCreditCardBillAsPaidUseCase
  implements IUseCase<MarkCreditCardBillAsPaidRequestDTO>
{
  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly unitOfWork: IPayCreditCardBillUnitOfWork,
    private readonly eventPublisher: IEventPublisher,
    private readonly paymentCategoryId: string,
  ) {}

  async execute(
    request: MarkCreditCardBillAsPaidRequestDTO,
  ): Promise<
    Either<DomainError | ApplicationError, MarkCreditCardBillAsPaidResponseDTO>
  > {
    const billResult = await this.getCreditCardBillRepository.execute(
      request.billId,
    );

    if (billResult.hasError) {
      return Either.errors(billResult.errors);
    }

    const bill = billResult.data;
    if (!bill) {
      return Either.error(new CreditCardBillNotFoundError());
    }

    const accountResult = await this.getAccountRepository.execute(
      request.accountId,
    );

    if (accountResult.hasError) {
      return Either.errors(accountResult.errors);
    }

    const account = accountResult.data;
    if (!account) {
      return Either.error(new AccountNotFoundError());
    }

    if (!account.canSubtract(request.paymentAmount)) {
      return Either.error(new InsufficientBalanceError());
    }

    const payResult = bill.markAsPaid(
      request.paymentAmount,
      request.paymentDate,
    );

    if (payResult.hasError) {
      return Either.errors(payResult.errors);
    }

    const subtractResult = account.subtractAmount(request.paymentAmount);
    if (subtractResult.hasError) {
      return Either.errors(subtractResult.errors);
    }

    const transactionResult = Transaction.create({
      description: 'Pagamento fatura',
      amount: request.paymentAmount,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: request.paymentDate,
      categoryId: this.paymentCategoryId,
      budgetId: account.budgetId!,
      accountId: account.id,
    });

    if (transactionResult.hasError) {
      return Either.errors(transactionResult.errors);
    }

    const transaction = transactionResult.data!;

    const uowResult = await this.unitOfWork.executePayment({
      account,
      bill,
      transaction,
    });

    if (uowResult.hasError) {
      return Either.errors(uowResult.errors);
    }

    const events = [...bill.getEvents(), ...transaction.getEvents()];
    try {
      if (events.length) await this.eventPublisher.publishMany(events);
      bill.clearEvents();
      transaction.clearEvents();
    } catch (error) {
      console.error('Failed to publish domain events:', error);
    }

    return Either.success({
      id: bill.id,
      paidAt: bill.paidAt!,
      status: bill.status,
    });
  }
}
