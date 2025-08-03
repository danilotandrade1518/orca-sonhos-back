import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { CreditCardBillAlreadyPaidError } from '@domain/aggregates/credit-card-bill/errors/CreditCardBillAlreadyPaidError';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { MarkCreditCardBillAsPaidRepositoryStub } from '../../../shared/tests/stubs/MarkCreditCardBillAsPaidRepositoryStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetCreditCardBillRepositoryStub } from '../../../shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { MarkCreditCardBillAsPaidDto } from './MarkCreditCardBillAsPaidDto';
import { MarkCreditCardBillAsPaidUseCase } from './MarkCreditCardBillAsPaidUseCase';

const PAYMENT_CATEGORY_ID = EntityId.create().value!.id;

const makeCreditCardBill = (): CreditCardBill => {
  const data = {
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-25'),
    amount: 50000,
  };
  const result = CreditCardBill.create(data);
  if (result.hasError) throw new Error('fail');
  return result.data!;
};

const makeAccount = (budgetId: string): Account => {
  const result = Account.create({
    name: 'Conta',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    initialBalance: 100000,
  });
  if (result.hasError) throw new Error('fail');
  return result.data!;
};

describe('MarkCreditCardBillAsPaidUseCase', () => {
  let useCase: MarkCreditCardBillAsPaidUseCase;
  let getBillRepo: GetCreditCardBillRepositoryStub;
  let getAccountRepo: GetAccountRepositoryStub;
  let markRepo: MarkCreditCardBillAsPaidRepositoryStub;
  let authService: BudgetAuthorizationServiceStub;
  let eventPublisher: EventPublisherStub;
  let account: Account;
  let bill: CreditCardBill;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getBillRepo = new GetCreditCardBillRepositoryStub();
    getAccountRepo = new GetAccountRepositoryStub();
    markRepo = new MarkCreditCardBillAsPaidRepositoryStub();
    authService = new BudgetAuthorizationServiceStub();
    eventPublisher = new EventPublisherStub();
    useCase = new MarkCreditCardBillAsPaidUseCase(
      getBillRepo,
      getAccountRepo,
      markRepo,
      authService,
      eventPublisher,
      PAYMENT_CATEGORY_ID,
    );

    bill = makeCreditCardBill();
    account = makeAccount(budgetId);
    getBillRepo.setCreditCardBill(bill);
    getAccountRepo.mockAccount = account;
  });

  const makeDto = (): MarkCreditCardBillAsPaidDto => ({
    userId,
    budgetId,
    creditCardBillId: bill.id,
    paymentAmount: 50000,
    paymentDate: new Date('2024-01-20'),
    sourceAccountId: account.id,
  });

  it('should pay bill successfully', async () => {
    const dto = makeDto();
    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(false);
    expect(markRepo.executeCalls.length).toBe(1);
    expect(eventPublisher.publishManyCalls.length).toBe(1);
  });

  it('should return error when bill not found', async () => {
    getBillRepo.setCreditCardBill(null);
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new CreditCardBillNotFoundError());
  });

  it('should return error when bill already paid', async () => {
    bill.markAsPaid(50000, new Date('2024-01-10'));
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(CreditCardBillAlreadyPaidError);
  });

  it('should return error when account not found', async () => {
    getAccountRepo.mockAccount = null;
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('should return error when user lacks permission', async () => {
    authService.mockHasAccess = false;
    const dto = makeDto();
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
  });
});
