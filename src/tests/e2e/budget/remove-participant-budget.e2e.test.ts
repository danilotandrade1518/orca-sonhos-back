import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetBudgetRepositoryStub } from '@application/shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '@application/shared/tests/stubs/SaveBudgetRepositoryStub';
import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { createHttpTestServer } from '../support/http-test-server';
import { RemoveParticipantFromBudgetController } from '@http/controllers/budget/remove-participant.controller';
import { RouteDefinition } from '@http/server-adapter';
import { HttpMiddleware } from '@http/http-types';
import request from 'supertest';

const getRepoRemove = new GetBudgetRepositoryStub();
const saveRepoRemove = new SaveBudgetRepositoryStub();
const authRemove = new BudgetAuthorizationServiceStub();
authRemove.mockHasAccess = true;

const ownerIdRemove = EntityId.create().value!.id;
const budgetResultRemove = Budget.create({
  name: 'Budget R',
  ownerId: ownerIdRemove,
  participantIds: [EntityId.create().value!.id],
  type: BudgetTypeEnum.PERSONAL,
});
getRepoRemove.mockBudget = budgetResultRemove.data!;

const removeParticipantUseCase = new RemoveParticipantFromBudgetUseCase(
  getRepoRemove,
  saveRepoRemove,
  authRemove,
);

const createTestAuthMiddleware = (): HttpMiddleware => {
  return async (req, next) => {
    const body = req.body as { userId?: string };
    if (body?.userId) {
      req.principal = { userId: body.userId };
    }
    return next();
  };
};

describe('POST /budgets/participants/remove (remove participant) E2E', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new RemoveParticipantFromBudgetController(
      removeParticipantUseCase,
    );
    const routes: RouteDefinition[] = [
      {
        method: 'POST',
        path: '/budgets/participants/remove',
        controller,
        middlewares: [createTestAuthMiddleware()],
      },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should remove a participant and return 200 with id and traceId', async () => {
    const participantId = budgetResultRemove.data!.participants[0];
    const res = await request(server.rawApp)
      .post('/budgets/participants/remove')
      .send({
        userId: ownerIdRemove,
        budgetId: budgetResultRemove.data!.id,
        participantId,
      })
      .expect(200);
    expect(res.body.id).toBe(budgetResultRemove.data!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 400 with errors array when participant not found', async () => {
    const res = await request(server.rawApp)
      .post('/budgets/participants/remove')
      .send({
        userId: ownerIdRemove,
        budgetId: budgetResultRemove.data!.id,
        participantId: 'missing',
      })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
