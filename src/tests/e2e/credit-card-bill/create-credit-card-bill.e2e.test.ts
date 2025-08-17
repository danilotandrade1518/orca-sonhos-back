import { AddCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/AddCreditCardBillRepositoryStub';
import { CreateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreateCreditCardBillController } from '@http/controllers/credit-card-bill/create-credit-card-bill.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

describe('POST /credit-card-bills (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const repo = new AddCreditCardBillRepositoryStub();
  const useCase = new CreateCreditCardBillUseCase(repo);
  const controller = new CreateCreditCardBillController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/credit-card-bills', controller });
  });
  afterAll(async () => close());

  it('should create credit card bill 201', async () => {
    const res = await request(server.rawApp)
      .post('/credit-card-bills')
      .send({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        amount: 500,
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    repo.shouldFail = true;
    await request(server.rawApp)
      .post('/credit-card-bills')
      .send({
        creditCardId: EntityId.create().value!.id,
        closingDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        amount: 500,
      })
      .expect(400);
  });
});
