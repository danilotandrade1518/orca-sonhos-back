import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { GetCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { IPayCreditCardBillUnitOfWorkStub } from '@application/shared/tests/stubs/IPayCreditCardBillUnitOfWorkStub';
import { PayCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/pay-credit-card-bill/PayCreditCardBillUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import {
  CreditCardBill,
  RestoreCreditCardBillDTO,
} from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { PayCreditCardBillController } from '@http/controllers/credit-card-bill/pay-credit-card-bill.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

function restoreBill(): CreditCardBill {
  const restore: RestoreCreditCardBillDTO = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2025-01-10'),
    dueDate: new Date('2025-01-25'),
    amount: 50000,
    status: BillStatusEnum.OPEN,
    paidAt: undefined,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return CreditCardBill.restore(restore).data!;
}

function restoreAccount(budgetId: string): Account {
  const restore = {
    id: EntityId.create().value!.id,
    name: 'Conta',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    balance: 100000,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return Account.restore(restore).data!;
}

describe('POST /credit-card-bills/pay (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const bill = restoreBill();
  const getBillRepo = new GetCreditCardBillRepositoryStub();
  getBillRepo.mockCreditCardBill = bill;

  const account = restoreAccount(bill.creditCardId);
  const getAccountRepo = new GetAccountRepositoryStub();
  getAccountRepo.mockAccount = account;

  const uow = new IPayCreditCardBillUnitOfWorkStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new PayCreditCardBillUseCase(
    getBillRepo,
    getAccountRepo,
    uow,
    authService,
  );
  const controller = new PayCreditCardBillController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/credit-card-bills/pay', controller });
  });
  afterAll(async () => close());

  it('should pay bill 200', async () => {
    const res = await request(server.rawApp)
      .post('/credit-card-bills/pay')
      .send({
        creditCardBillId: bill.id,
        accountId: account.id,
        userId: EntityId.create().value!.id,
        budgetId: account.budgetId!,
        amount: 100,
        paymentCategoryId: EntityId.create().value!.id,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map unit of work error', async () => {
    uow.shouldFail = true;
    await request(server.rawApp)
      .post('/credit-card-bills/pay')
      .send({
        creditCardBillId: bill.id,
        accountId: account.id,
        userId: EntityId.create().value!.id,
        budgetId: account.budgetId!,
        amount: 50,
        paymentCategoryId: EntityId.create().value!.id,
      })
      .expect(400);
  });
});
