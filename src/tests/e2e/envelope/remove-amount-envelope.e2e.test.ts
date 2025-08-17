import { ISaveEnvelopeRepository } from '@application/contracts/repositories/envelope/ISaveEnvelopeRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { GetEnvelopeRepositoryStub } from '@application/shared/tests/stubs/GetEnvelopeRepositoryStub';
import { RemoveAmountFromEnvelopeUseCase } from '@application/use-cases/envelope/remove-amount-from-envelope/RemoveAmountFromEnvelopeUseCase';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { RemoveAmountEnvelopeController } from '@http/controllers/envelope/remove-amount-envelope.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeEnvelope(budgetId: string): Envelope {
  const id = EntityId.create().value!.id;
  const env: Partial<Envelope> & { id: string; budgetId: string } = {
    id,
    budgetId,
    removeAmount: () => Either.success(undefined),
  };
  return env as Envelope;
}

class SaveEnvelopeRepoStub implements ISaveEnvelopeRepository {
  public shouldFail = false;
  async execute(envelope: Envelope) {
    void envelope;
    if (this.shouldFail)
      return Either.error<DomainError, void>(
        new (class extends DomainError {})('save fail'),
      );
    return Either.success<DomainError, void>(undefined);
  }
}

class BudgetAuthorizationServiceStub implements IBudgetAuthorizationService {
  public allow = true;
  public shouldFail = false;
  async canAccessBudget(
    userId: string,
    budgetId: string,
  ): Promise<Either<ApplicationError, boolean>> {
    void userId;
    void budgetId;
    if (this.shouldFail)
      return Either.error<ApplicationError, boolean>(
        new (class extends ApplicationError {})('auth fail'),
      );
    return Either.success<ApplicationError, boolean>(this.allow);
  }
}

describe('POST /envelopes/remove-amount (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const envelope = makeEnvelope(EntityId.create().value!.id);
  const getRepo = new GetEnvelopeRepositoryStub();
  getRepo.mockEnvelopes = { [envelope.id]: envelope };

  const saveRepo = new SaveEnvelopeRepoStub();
  const authService = new BudgetAuthorizationServiceStub();
  const useCase = new RemoveAmountFromEnvelopeUseCase(
    getRepo,
    saveRepo,
    authService,
  );
  const controller = new RemoveAmountEnvelopeController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/envelopes/remove-amount', controller });
  });
  afterAll(async () => close());

  it('should remove amount 200', async () => {
    const res = await request(server.rawApp)
      .post('/envelopes/remove-amount')
      .send({
        envelopeId: envelope.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
        amount: 40,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/envelopes/remove-amount')
      .send({
        envelopeId: EntityId.create().value!.id,
        userId: EntityId.create().value!.id,
        budgetId: envelope.budgetId,
        amount: 10,
      })
      .expect(400);
  });
});
