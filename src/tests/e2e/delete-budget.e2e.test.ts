import request from 'supertest';

import { ExpressHttpServerAdapter } from '../../interface/http/adapters/express-adapter';
import { RouteDefinition } from '../../interface/http/server-adapter';
import { DeleteBudgetController } from '../../interface/http/controllers/budget/delete-budget.controller';
import { DeleteBudgetUseCase } from '@application/use-cases/budget/delete-budget/DeleteBudgetUseCase';
import { GetBudgetRepositoryStub } from '@application/shared/tests/stubs/GetBudgetRepositoryStub';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { DeleteBudgetRepositoryStub } from '@application/shared/tests/stubs/DeleteBudgetRepositoryStub';
import { CheckBudgetDependenciesRepositoryStub } from '@application/shared/tests/stubs/CheckBudgetDependenciesRepositoryStub';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

const getRepoD = new GetBudgetRepositoryStub();
const deleteRepo = new DeleteBudgetRepositoryStub();
const depsRepo = new CheckBudgetDependenciesRepositoryStub();
const authServiceD = new BudgetAuthorizationServiceStub();
authServiceD.mockHasAccess = true;

const budgetResultD = Budget.create({
  name: 'Budget X',
  ownerId: EntityId.create().value!.id,
  participantIds: [],
  type: BudgetTypeEnum.PERSONAL,
});
getRepoD.mockBudget = budgetResultD.data!;
depsRepo.hasAccountsResult = false;
depsRepo.hasTransactionsResult = false;

const deleteUseCase = new DeleteBudgetUseCase(
  getRepoD,
  deleteRepo,
  depsRepo,
  authServiceD,
);

describe('DELETE /budgets (delete budget) E2E', () => {
  let server: ExpressHttpServerAdapter;

  beforeAll(() => {
    server = new ExpressHttpServerAdapter();
    const controller = new DeleteBudgetController(deleteUseCase);
    const routes: RouteDefinition[] = [
      { method: 'DELETE', path: '/budgets', controller },
    ];
    server.registerRoutes(routes);
  });

  it('should delete a budget and return 200 with id and traceId', async () => {
    const res = await request(server.rawApp)
      .delete('/budgets')
      .send({
        userId: budgetResultD.data!.ownerId,
        budgetId: budgetResultD.data!.id,
      })
      .expect(200);
    expect(res.body.id).toBe(budgetResultD.data!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 400 with errors array when budget not found', async () => {
    const res = await request(server.rawApp)
      .delete('/budgets')
      .send({
        userId: budgetResultD.data!.ownerId,
        budgetId: 'missing',
      })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
