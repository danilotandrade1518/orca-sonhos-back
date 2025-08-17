import { GetEnvelopeRepositoryStub } from '@application/shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '@application/shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { UpdateEnvelopeUseCase } from '@application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { UpdateEnvelopeController } from '@http/controllers/envelope/update-envelope.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

function makeEnvelope(budgetId: string): Envelope {
  const id = EntityId.create().value!.id;
  const env: Partial<Envelope> & { id: string; budgetId: string } = {
    id,
    budgetId,
    updateName: () => Either.success(undefined),
    updateLimit: () => Either.success(undefined),
  };
  return env as Envelope;
}

describe('PUT /envelopes (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const envelope = makeEnvelope(EntityId.create().value!.id);
  const getRepo = new GetEnvelopeRepositoryStub();
  getRepo.mockEnvelopes = { [envelope.id]: envelope };

  const saveRepo = new SaveEnvelopeRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new UpdateEnvelopeUseCase(getRepo, saveRepo, authService);
  const controller = new UpdateEnvelopeController(useCase);

  beforeAll(() => {
    register({ method: 'PUT', path: '/envelopes', controller });
  });
  afterAll(async () => close());

  it('should update envelope 200', async () => {
    const res = await request(server.rawApp)
      .put('/envelopes')
      .send({
        envelopeId: envelope.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
        name: 'Novo',
        monthlyLimit: 900,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .put('/envelopes')
      .send({
        envelopeId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
      })
      .expect(400);
  });
});
