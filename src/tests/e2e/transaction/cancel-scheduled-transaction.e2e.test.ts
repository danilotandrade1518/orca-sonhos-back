import { GetTransactionRepositoryStub } from '@application/shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '@application/shared/tests/stubs/SaveTransactionRepositoryStub';
import { CancelScheduledTransactionUseCase } from '@application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { CancelScheduledTransactionController } from '@http/controllers/transaction/cancel-scheduled-transaction.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

function makeTransaction(budgetId: string): Transaction {
  const id = EntityId.create().value!.id;
  const tx: Partial<Transaction> & { id: string; budgetId: string } = {
    id,
    budgetId,
    cancel: () => Either.success(undefined),
  };
  return tx as Transaction;
}

describe('POST /transactions/cancel-scheduled (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const transaction = makeTransaction(EntityId.create().value!.id);
  const getRepo = new GetTransactionRepositoryStub();
  getRepo.mockTransaction = transaction;

  const saveRepo = new SaveTransactionRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new CancelScheduledTransactionUseCase(
    getRepo,
    saveRepo,
    authService,
  );
  const controller = new CancelScheduledTransactionController(useCase);

  beforeAll(() => {
    register({
      method: 'POST',
      path: '/transactions/cancel-scheduled',
      controller,
    });
  });
  afterAll(async () => close());

  it('should cancel 200', async () => {
    const res = await request(server.rawApp)
      .post('/transactions/cancel-scheduled')
      .send({
        userId: EntityId.create().value!.id,
        budgetId: transaction.budgetId,
        transactionId: transaction.id,
        cancellationReason: 'No longer needed',
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/transactions/cancel-scheduled')
      .send({
        userId: EntityId.create().value!.id,
        budgetId: transaction.budgetId,
        transactionId: EntityId.create().value!.id,
        cancellationReason: 'X',
      })
      .expect(400);
  });
});
