import { GetEnvelopeRepositoryStub } from '@application/shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '@application/shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { DeleteEnvelopeUseCase } from '@application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteEnvelopeController } from '@http/controllers/envelope/delete-envelope.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

function makeEnvelope(budgetId: string): Envelope {
  const id = EntityId.create().value!.id;
  const env: Partial<Envelope> & {
    id: string;
    budgetId: string;
  } = {
    id,
    budgetId,
    delete: () => Either.success(undefined),
  };
  return env as Envelope;
}

describe('DELETE /envelopes (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const envelope = makeEnvelope(EntityId.create().value!.id);
  const getRepo = new GetEnvelopeRepositoryStub();
  getRepo.mockEnvelopes = { [envelope.id]: envelope };

  const saveRepo = new SaveEnvelopeRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new DeleteEnvelopeUseCase(getRepo, saveRepo, authService);
  const controller = new DeleteEnvelopeController(useCase);

  beforeAll(() => {
    register({ method: 'DELETE', path: '/envelopes', controller });
  });
  afterAll(async () => close());

  it('should delete envelope 200', async () => {
    const res = await request(server.rawApp)
      .delete('/envelopes')
      .send({
        envelopeId: envelope.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .delete('/envelopes')
      .send({
        envelopeId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
      })
      .expect(400);
  });
});
