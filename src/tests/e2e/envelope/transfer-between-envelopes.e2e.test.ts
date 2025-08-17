import { GetEnvelopeRepositoryStub } from '@application/shared/tests/stubs/GetEnvelopeRepositoryStub';
import { TransferBetweenEnvelopesUnitOfWorkStub } from '@application/shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub';
import { TransferBetweenEnvelopesUseCase } from '@application/use-cases/envelope/transfer-between-envelopes/TransferBetweenEnvelopesUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { TransferBetweenEnvelopesService } from '@domain/aggregates/envelope/services/TransferBetweenEnvelopesService';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { TransferBetweenEnvelopesController } from '@http/controllers/envelope/transfer-between-envelopes.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

const budgetId = EntityId.create().value!.id;

function makeEnvelope(): Envelope {
  const id = EntityId.create().value!.id;
  const env: Partial<Envelope> & { id: string; budgetId: string } = {
    id,
    budgetId,
    removeAmount: () => Either.success(undefined),
    addAmount: () => Either.success(undefined),
  };
  return env as Envelope;
}

describe('POST /envelopes/transfer (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const envelope1 = makeEnvelope();
  const envelope2 = makeEnvelope();
  const getRepo = new GetEnvelopeRepositoryStub();
  getRepo.mockEnvelopes = {
    [envelope1.id]: envelope1,
    [envelope2.id]: envelope2,
  };

  const uow = new TransferBetweenEnvelopesUnitOfWorkStub();
  const authService = new MockBudgetAuthorizationService();
  const service = new TransferBetweenEnvelopesService();
  const useCase = new TransferBetweenEnvelopesUseCase(
    getRepo,
    service,
    uow,
    authService,
  );
  const controller = new TransferBetweenEnvelopesController(useCase);

  const sourceId = envelope1.id;
  const targetId = envelope2.id;

  beforeAll(() => {
    register({ method: 'POST', path: '/envelopes/transfer', controller });
  });
  afterAll(async () => close());

  it('should transfer 200', async () => {
    const res = await request(server.rawApp)
      .post('/envelopes/transfer')
      .send({
        sourceEnvelopeId: sourceId,
        targetEnvelopeId: targetId,
        userId: EntityId.create().value!.id,
        budgetId,
        amount: 25,
      })
      .expect(200);

    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map uow error', async () => {
    uow.shouldFail = true;
    await request(server.rawApp)
      .post('/envelopes/transfer')
      .send({
        sourceEnvelopeId: sourceId,
        targetEnvelopeId: targetId,
        userId: EntityId.create().value!.id,
        budgetId,
        amount: 10,
      })
      .expect(400);
  });
});
