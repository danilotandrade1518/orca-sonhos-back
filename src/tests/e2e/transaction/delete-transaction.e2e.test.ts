import { DeleteTransactionRepositoryStub } from '@application/shared/tests/stubs/DeleteTransactionRepositoryStub';
import { GetTransactionRepositoryStub } from '@application/shared/tests/stubs/GetTransactionRepositoryStub';
import { DeleteTransactionUseCase } from '@application/use-cases/transaction/delete-transaction/DeleteTransactionUseCase';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteTransactionController } from '@http/controllers/transaction/delete-transaction.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

function makeTransaction(): Transaction {
  const id = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const tx: Partial<Transaction> & { id: string; budgetId: string } = {
    id,
    budgetId,
    delete: () => Either.success(tx as Transaction),
  };
  return tx as Transaction;
}

describe('DELETE /transactions (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const transaction = makeTransaction();
  const getRepo = new GetTransactionRepositoryStub();
  getRepo.mockTransaction = transaction;

  const delRepo = new DeleteTransactionRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new DeleteTransactionUseCase(getRepo, delRepo, authService);
  const controller = new DeleteTransactionController(useCase);

  beforeAll(() => {
    register({ method: 'DELETE', path: '/transactions', controller });
  });
  afterAll(async () => close());

  it('should delete 200', async () => {
    const res = await request(server.rawApp)
      .delete('/transactions')
      .send({ id: transaction.id, userId: EntityId.create().value!.id })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .delete('/transactions')
      .send({
        id: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
      })
      .expect(400);
  });
});
