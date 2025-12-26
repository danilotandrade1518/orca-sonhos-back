import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetBudgetRepositoryStub } from '@application/shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '@application/shared/tests/stubs/SaveBudgetRepositoryStub';
import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { createHttpTestServer } from '../support/http-test-server';
import { AddParticipantToBudgetController } from '@http/controllers/budget/add-participant.controller';
import { RouteDefinition } from '@http/server-adapter';
import { HttpMiddleware } from '@http/http-types';
import request from 'supertest';

const getRepoAdd = new GetBudgetRepositoryStub();
const saveRepoAdd = new SaveBudgetRepositoryStub();
const authAdd = new BudgetAuthorizationServiceStub();
authAdd.mockHasAccess = true;

const ownerIdAdd = EntityId.create().value!.id;
const budgetResultAdd = Budget.create({
  name: 'Budget P',
  ownerId: ownerIdAdd,
  participantIds: [],
  type: BudgetTypeEnum.SHARED,
});
getRepoAdd.mockBudget = budgetResultAdd.data!;

const addParticipantUseCase = new AddParticipantToBudgetUseCase(
  getRepoAdd,
  saveRepoAdd,
  authAdd,
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

describe('POST /budgets/participants/add (add participant) E2E', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new AddParticipantToBudgetController(
      addParticipantUseCase,
    );
    const routes: RouteDefinition[] = [
      {
        method: 'POST',
        path: '/budgets/participants/add',
        controller,
        middlewares: [createTestAuthMiddleware()],
      },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should add a participant and return 200 with id and traceId', async () => {
    const res = await request(server.rawApp)
      .post('/budgets/participants/add')
      .send({
        userId: ownerIdAdd,
        budgetId: budgetResultAdd.data!.id,
        participantId: EntityId.create().value!.id,
      })
      .expect(200);
    expect(res.body.id).toBe(budgetResultAdd.data!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 400 with errors array when participant missing', async () => {
    const res = await request(server.rawApp)
      .post('/budgets/participants/add')
      .send({
        userId: ownerIdAdd,
        budgetId: budgetResultAdd.data!.id,
        participantId: '',
      })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
