import { GetEnvelopeRepositoryStub } from '@application/shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '@application/shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { AddAmountToEnvelopeUseCase } from '@application/use-cases/envelope/add-amount-to-envelope/AddAmountToEnvelopeUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { AddAmountEnvelopeController } from '@http/controllers/envelope/add-amount-envelope.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

function makeEnvelope(budgetId: string): Envelope {
  const id = EntityId.create().value!.id;
  const env: Partial<Envelope> & { id: string; budgetId: string } = {
    id,
    budgetId,
    addAmount: () => Either.success(undefined),
  };
  return env as Envelope;
}

describe('POST /envelopes/add-amount (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const envelope = makeEnvelope(EntityId.create().value!.id);
  const getRepo = new GetEnvelopeRepositoryStub();
  getRepo.mockEnvelopes = { [envelope.id]: envelope };

  const saveRepo = new SaveEnvelopeRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new AddAmountToEnvelopeUseCase(
    getRepo,
    saveRepo,
    authService,
  );
  const controller = new AddAmountEnvelopeController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/envelopes/add-amount', controller });
  });
  afterAll(async () => close());

  it('should add amount 200', async () => {
    const res = await request(server.rawApp)
      .post('/envelopes/add-amount')
      .send({
        envelopeId: envelope.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
        amount: 100,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/envelopes/add-amount')
      .send({
        envelopeId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
        amount: 50,
      })
      .expect(400);
  });
});
