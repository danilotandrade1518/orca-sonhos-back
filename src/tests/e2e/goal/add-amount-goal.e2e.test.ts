import { GetGoalByIdRepositoryStub } from '@application/shared/tests/stubs/GetGoalByIdRepositoryStub';
import { SaveGoalRepositoryStub } from '@application/shared/tests/stubs/SaveGoalRepositoryStub';
import { AddAmountToGoalUseCase } from '@application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { AddAmountGoalController } from '@http/controllers/goal/add-amount-goal.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeGoal(): Goal {
  const id = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const env: Partial<Goal> & { id: string; budgetId: string } = {
    id,
    budgetId,
    addAmount: () => Either.success(undefined),
  };
  return env as Goal;
}

describe('PATCH /goals/amount (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const goal = makeGoal();
  const getRepo = new GetGoalByIdRepositoryStub();
  getRepo.mockGoal = goal;

  const saveRepo = new SaveGoalRepositoryStub();
  const useCase = new AddAmountToGoalUseCase(getRepo, saveRepo);
  const controller = new AddAmountGoalController(useCase);

  beforeAll(() => {
    register({ method: 'PATCH', path: '/goals/amount', controller });
  });
  afterAll(async () => {
    await close();
  });

  it('should add amount 200', async () => {
    const res = await request(server.rawApp)
      .patch('/goals/amount')
      .send({
        id: goal.id,
        amount: 150,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map errors', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .patch('/goals/amount')
      .send({
        id: EntityId.create().value!.id,
        amount: 10,
      })
      .expect(400);
  });
});
