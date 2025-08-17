import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { GetTransactionRepositoryStub } from '@application/shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '@application/shared/tests/stubs/SaveTransactionRepositoryStub';
import { UpdateTransactionUseCase } from '@application/use-cases/transaction/update-transaction/UpdateTransactionUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { UpdateTransactionController } from '@http/controllers/transaction/update-transaction.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

const account: Account = Account.create({
  name: 'Original',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId: EntityId.create().value!.id,
  initialBalance: 100,
})!.data as Account;

function makeTransaction(): Transaction {
  const id = EntityId.create().value!.id;
  const accountId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const tx: Partial<Transaction> & { id: string } = {
    id,
    description: 'Orig Desc',
    amount: 50,
    type: TransactionTypeEnum.EXPENSE,
    accountId,
    categoryId: EntityId.create().value!.id,
    budgetId,
    transactionDate: new Date(),
    update: (data: Partial<Transaction>) => {
      Object.assign(tx, data);
      return Either.success(tx as Transaction);
    },
  };
  return tx as Transaction;
}

describe('PUT /transactions (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const transaction = makeTransaction();
  const getTxRepo = new GetTransactionRepositoryStub();
  getTxRepo.mockTransaction = transaction;

  const getAccRepo = new GetAccountRepositoryStub();
  getAccRepo.mockAccount = account;

  const saveTxRepo = new SaveTransactionRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new UpdateTransactionUseCase(
    getTxRepo,
    saveTxRepo,
    getAccRepo,
    authService,
  );
  const controller = new UpdateTransactionController(useCase);

  beforeAll(() => {
    register({ method: 'PUT', path: '/transactions', controller });
  });

  afterAll(async () => {
    await close();
  });

  it('should update 200', async () => {
    const res = await request(server.rawApp)
      .put('/transactions')
      .send({
        userId: EntityId.create().value!.id,
        id: transaction.id,
        description: 'Updated',
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repository error (not found)', async () => {
    getTxRepo.shouldFail = true;
    await request(server.rawApp)
      .put('/transactions')
      .send({
        userId: EntityId.create().value!.id,
        id: EntityId.create().value!.id,
        description: 'X',
      })
      .expect(400);
  });
});
