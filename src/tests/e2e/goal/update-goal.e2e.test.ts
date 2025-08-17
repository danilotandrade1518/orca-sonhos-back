import { GetGoalByIdRepositoryStub } from '@application/shared/tests/stubs/GetGoalByIdRepositoryStub';
import { SaveGoalRepositoryStub } from '@application/shared/tests/stubs/SaveGoalRepositoryStub';
import { UpdateGoalUseCase } from '@application/use-cases/goal/update-goal/UpdateGoalUseCase';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { UpdateGoalController } from '@http/controllers/goal/update-goal.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeGoal(): Goal {
  const id = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const env: Partial<Goal> & { id: string; budgetId: string } = {
    id,
    budgetId,
    update: () => Either.success(undefined),
  };
  return env as Goal;
}

describe('PATCH /goals (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const goal = makeGoal();
  const getRepo = new GetGoalByIdRepositoryStub();
  getRepo.mockGoal = goal;

  const saveRepo = new SaveGoalRepositoryStub();
  const useCase = new UpdateGoalUseCase(getRepo, saveRepo);
  const controller = new UpdateGoalController(useCase);

  beforeAll(() => {
    register({ method: 'PATCH', path: '/goals', controller });
  });
  afterAll(async () => {
    await close();
  });

  it('should update goal 200', async () => {
    const res = await request(server.rawApp)
      .patch('/goals')
      .send({
        id: goal.id,
        name: 'Meta Atualizada',
        totalAmount: 2000,
        deadline: new Date().toISOString(),
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map errors', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .patch('/goals')
      .send({
        id: EntityId.create().value!.id,
        name: 'X',
        totalAmount: 10,
      })
      .expect(400);
  });
});
