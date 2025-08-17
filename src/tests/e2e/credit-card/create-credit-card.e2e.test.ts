import { AddCreditCardRepositoryStub } from '@application/shared/tests/stubs/AddCreditCardRepositoryStub';
import { CreateCreditCardUseCase } from '@application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreateCreditCardController } from '@http/controllers/credit-card/create-credit-card.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

describe('POST /credit-cards (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const addRepo = new AddCreditCardRepositoryStub();
  const useCase = new CreateCreditCardUseCase(addRepo);
  const controller = new CreateCreditCardController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/credit-cards', controller });
  });
  afterAll(async () => close());

  it('should create 201', async () => {
    const res = await request(server.rawApp)
      .post('/credit-cards')
      .send({
        name: 'Nubank',
        limit: 5000,
        closingDay: 10,
        dueDay: 20,
        budgetId: EntityId.create().value!.id,
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    addRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/credit-cards')
      .send({
        name: 'X',
        limit: 1000,
        closingDay: 5,
        dueDay: 15,
        budgetId: EntityId.create().value!.id,
      })
      .expect(400);
  });
});
