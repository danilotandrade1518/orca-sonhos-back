import { GetTransactionRepositoryStub } from '@application/shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '@application/shared/tests/stubs/SaveTransactionRepositoryStub';
import { MarkTransactionLateUseCase } from '@application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { MarkTransactionLateController } from '@http/controllers/transaction/mark-transaction-late.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeTransaction(): Transaction {
  const id = EntityId.create().value!.id;
  const tx: Partial<Transaction> & { id: string } = {
    id,
    markAsLate: () => Either.success(undefined),
  };
  return tx as Transaction;
}

describe('POST /transactions/mark-late (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const transaction = makeTransaction();
  const getRepo = new GetTransactionRepositoryStub();
  getRepo.mockTransaction = transaction;

  const saveRepo = new SaveTransactionRepositoryStub();
  const useCase = new MarkTransactionLateUseCase(getRepo, saveRepo);
  const controller = new MarkTransactionLateController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/transactions/mark-late', controller });
  });
  afterAll(async () => close());

  it('should mark late 200', async () => {
    const res = await request(server.rawApp)
      .post('/transactions/mark-late')
      .send({ transactionId: transaction.id })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/transactions/mark-late')
      .send({ transactionId: EntityId.create().value!.id })
      .expect(400);
  });
});
