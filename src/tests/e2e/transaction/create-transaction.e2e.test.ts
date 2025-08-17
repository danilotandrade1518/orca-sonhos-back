import { AddTransactionRepositoryStub } from '@application/shared/tests/stubs/AddTransactionRepositoryStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction/CreateTransactionUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreateTransactionController } from '@http/controllers/transaction/create-transaction.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

const account: Account = Account.create({
  name: 'Original',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId: EntityId.create().value!.id,
  initialBalance: 100,
})!.data as Account;

describe('POST /transactions (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const addRepo = new AddTransactionRepositoryStub();

  const getAccountRepo = new GetAccountRepositoryStub();
  getAccountRepo.mockAccount = account;

  const authService = new MockBudgetAuthorizationService();
  const useCase = new CreateTransactionUseCase(
    addRepo,
    getAccountRepo,
    authService,
  );
  const controller = new CreateTransactionController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/transactions', controller });
  });

  afterAll(async () => {
    await close();
  });

  it('should create 201', async () => {
    const res = await request(server.rawApp)
      .post('/transactions')
      .send({
        userId: EntityId.create().value!.id,
        description: 'Compra',
        amount: 120.55,
        type: TransactionTypeEnum.EXPENSE,
        accountId: account.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        transactionDate: new Date().toISOString(),
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    addRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/transactions')
      .send({
        userId: EntityId.create().value!.id,
        description: 'X',
        amount: 10,
        type: TransactionTypeEnum.EXPENSE,
        accountId: account.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      })
      .expect(400);
  });
});
