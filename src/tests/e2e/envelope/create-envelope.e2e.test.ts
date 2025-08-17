import { IAddEnvelopeRepository } from '@application/contracts/repositories/envelope/IAddEnvelopeRepository';
import { CreateEnvelopeUseCase } from '@application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { CreateEnvelopeController } from '@http/controllers/envelope/create-envelope.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

class AddEnvelopeRepositoryStub implements IAddEnvelopeRepository {
  public shouldFail = false;
  async execute(envelope: Envelope): Promise<Either<DomainError, void>> {
    void envelope;
    if (this.shouldFail)
      return Either.error<DomainError, void>(
        new (class extends DomainError {})('add env fail'),
      );
    return Either.success<DomainError, void>(undefined);
  }
}

describe('POST /envelopes (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const addRepo = new AddEnvelopeRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new CreateEnvelopeUseCase(addRepo, authService);
  const controller = new CreateEnvelopeController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/envelopes', controller });
  });
  afterAll(async () => close());

  it('should create 201', async () => {
    const res = await request(server.rawApp)
      .post('/envelopes')
      .send({
        name: 'Mercado',
        monthlyLimit: 800,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    addRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/envelopes')
      .send({
        name: 'X',
        monthlyLimit: 100,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
      })
      .expect(400);
  });
});
