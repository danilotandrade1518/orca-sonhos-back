import { AddBudgetRepositoryStub } from '@application/shared/tests/stubs/AddBudgetRepositoryStub';
import { CreateBudgetUseCase } from '@application/use-cases/budget/create-budget/CreateBudgetUseCase';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import request from 'supertest';

import { ExpressHttpServerAdapter } from '../../interface/http/adapters/express-adapter';
import { RouteDefinition } from '../../interface/http/server-adapter';
import { CreateBudgetController } from '../../interface/http/controllers/budget/create-budget.controller';

// E2E focuses only on HTTP wiring (no DB). Using in-memory stub.

describe('POST /budgets (E2E)', () => {
  let server: ExpressHttpServerAdapter;

  beforeAll(() => {
    server = new ExpressHttpServerAdapter();
    const repo = new AddBudgetRepositoryStub();
    const useCase = new CreateBudgetUseCase(repo);
    const controller = new CreateBudgetController(useCase);

    const routes: RouteDefinition[] = [
      { method: 'POST', path: '/budgets', controller },
    ];
    server.registerRoutes(routes);
  });

  it('should create a budget and return 201 with id and traceId headers', async () => {
    const res = await request(server.rawApp)
      .post('/budgets')
      .send({
        name: 'Casa',
        ownerId: EntityId.create().value!.id,
        participantIds: [],
        type: BudgetTypeEnum.PERSONAL,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('should map domain errors to 400 (simulate by forcing invalid data)', async () => {
    // name empty likely invalid in domain entity creation
    const res = await request(server.rawApp)
      .post('/budgets')
      .send({
        name: '',
        ownerId: EntityId.create().value!.id,
        participantIds: [EntityId.create().value!.id],
      })
      .expect(400);

    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
