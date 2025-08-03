import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { CreditCardBill, RestoreCreditCardBillDTO } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetCreditCardBillRepositoryStub } from '../../../shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { IPayCreditCardBillUnitOfWorkStub } from '../../../shared/tests/stubs/IPayCreditCardBillUnitOfWorkStub';
import { InsufficientBalanceError } from '../../../../domain/aggregates/account/errors/InsufficientBalanceError';
import { MarkCreditCardBillAsPaidRequestDTO } from './MarkCreditCardBillAsPaidDTO';
import { MarkCreditCardBillAsPaidUseCase } from './MarkCreditCardBillAsPaidUseCase';

const CATEGORY_ID = EntityId.create().value!.id;

const makeAccount = () => {
  return Account.create({
    name: 'Conta',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId: EntityId.create().value!.id,
    initialBalance: 60000,
  }).data!;
};

const makeBill = (): CreditCardBill => {
  const billData: RestoreCreditCardBillDTO = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-10'),
    amount: 50000,
    status: BillStatusEnum.OPEN,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return CreditCardBill.restore(billData).data!;
};

describe('MarkCreditCardBillAsPaidUseCase', () => {
  let useCase: MarkCreditCardBillAsPaidUseCase;
  let getBillRepo: GetCreditCardBillRepositoryStub;
  let getAccountRepo: GetAccountRepositoryStub;
  let uowStub: IPayCreditCardBillUnitOfWorkStub;
  let eventPublisher: EventPublisherStub;
  let account: Account;
  let bill: CreditCardBill;

  beforeEach(() => {
    getBillRepo = new GetCreditCardBillRepositoryStub();
    getAccountRepo = new GetAccountRepositoryStub();
    uowStub = new IPayCreditCardBillUnitOfWorkStub();
    eventPublisher = new EventPublisherStub();
    useCase = new MarkCreditCardBillAsPaidUseCase(
      getBillRepo,
      getAccountRepo,
      uowStub,
      eventPublisher,
      CATEGORY_ID,
    );

    account = makeAccount();
    bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    getAccountRepo.mockAccount = account;
  });

  it('should pay bill successfully', async () => {
    const dto: MarkCreditCardBillAsPaidRequestDTO = {
      billId: bill.id,
      accountId: account.id,
      paymentAmount: 50000,
      paymentDate: new Date(),
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(uowStub.executePaymentCalls).toHaveLength(1);
    const payment = uowStub.executePaymentCalls[0];
    expect(payment.account.id).toBe(account.id);
    expect(payment.bill.id).toBe(bill.id);
    expect(payment.transaction.type).toBe(TransactionTypeEnum.EXPENSE);
  });

  it('should return error when bill not found', async () => {
    getBillRepo.setCreditCardBill(null);

    const dto: MarkCreditCardBillAsPaidRequestDTO = {
      billId: 'invalid',
      accountId: account.id,
      paymentAmount: 100,
      paymentDate: new Date(),
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new CreditCardBillNotFoundError());
  });

  it('should return error when account not found', async () => {
    getAccountRepo.mockAccount = null;

    const dto: MarkCreditCardBillAsPaidRequestDTO = {
      billId: bill.id,
      accountId: 'invalid',
      paymentAmount: 100,
      paymentDate: new Date(),
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('should return error when insufficient balance', async () => {
    const dto: MarkCreditCardBillAsPaidRequestDTO = {
      billId: bill.id,
      accountId: account.id,
      paymentAmount: 200000,
      paymentDate: new Date(),
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientBalanceError);
  });
});
