import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetBudgetRepositoryStub } from '@application/shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '@application/shared/tests/stubs/SaveBudgetRepositoryStub';
import { UpdateBudgetUseCase } from '@application/use-cases/budget/update-budget/UpdateBudgetUseCase';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { createHttpTestServer } from '../support/http-test-server';
import { UpdateBudgetController } from '@http/controllers/budget/update-budget.controller';
import { RouteDefinition } from '@http/server-adapter';
import request from 'supertest';

// Setup real use case with stubs
const getRepo = new GetBudgetRepositoryStub();
const saveRepo = new SaveBudgetRepositoryStub();
const authService = new BudgetAuthorizationServiceStub();
authService.mockHasAccess = true;

// domain budget for success path
const ownerId = EntityId.create().value!.id;
const budgetResult = Budget.create({
  name: 'Old',
  ownerId,
  participantIds: [],
  type: BudgetTypeEnum.PERSONAL,
});
getRepo.mockBudget = budgetResult.data!;

const useCase = new UpdateBudgetUseCase(getRepo, saveRepo, authService);

describe('PATCH /budgets (update budget) E2E', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new UpdateBudgetController(useCase);
    const routes: RouteDefinition[] = [
      { method: 'PATCH', path: '/budgets', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should update a budget and return 200 with id and traceId', async () => {
    const res = await request(server.rawApp)
      .patch('/budgets')
      .send({
        userId: ownerId,
        budgetId: getRepo.mockBudget!.id,
        name: 'Novo Nome',
      })
      .expect(200);
    expect(res.body.id).toBe(getRepo.mockBudget!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 400 with errors array when name invalid', async () => {
    const res = await request(server.rawApp)
      .patch('/budgets')
      .send({
        userId: ownerId,
        budgetId: getRepo.mockBudget!.id,
        name: '',
      })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
