import request from 'supertest';

import { ExpressHttpServerAdapter } from '../../interface/http/adapters/express-adapter';
import { RouteDefinition } from '../../interface/http/server-adapter';
import { AddParticipantToBudgetController } from '../../interface/http/controllers/budget/add-participant.controller';
import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { GetBudgetRepositoryStub } from '@application/shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '@application/shared/tests/stubs/SaveBudgetRepositoryStub';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

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

describe('POST /budgets/participants/add (add participant) E2E', () => {
  let server: ExpressHttpServerAdapter;

  beforeAll(() => {
    server = new ExpressHttpServerAdapter();
    const controller = new AddParticipantToBudgetController(
      addParticipantUseCase,
    );
    const routes: RouteDefinition[] = [
      { method: 'POST', path: '/budgets/participants/add', controller },
    ];
    server.registerRoutes(routes);
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
