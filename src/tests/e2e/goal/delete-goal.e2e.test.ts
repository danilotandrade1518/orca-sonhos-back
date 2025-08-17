import { DeleteGoalRepositoryStub } from '@application/shared/tests/stubs/DeleteGoalRepositoryStub';
import { GetGoalByIdRepositoryStub } from '@application/shared/tests/stubs/GetGoalByIdRepositoryStub';
import { DeleteGoalUseCase } from '@application/use-cases/goal/delete-goal/DeleteGoalUseCase';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteGoalController } from '@http/controllers/goal/delete-goal.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeGoal(): Goal {
  const id = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const env: Partial<Goal> & { id: string; budgetId: string } = {
    id,
    budgetId,
    delete: () => Either.success(undefined),
  };
  return env as Goal;
}

describe('DELETE /goals (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const goal = makeGoal();
  const getRepo = new GetGoalByIdRepositoryStub();
  getRepo.mockGoal = goal;

  const deleteRepo = new DeleteGoalRepositoryStub();
  const useCase = new DeleteGoalUseCase(getRepo, deleteRepo);
  const controller = new DeleteGoalController(useCase);

  beforeAll(() => {
    register({ method: 'DELETE', path: '/goals', controller });
  });
  afterAll(async () => {
    await close();
  });

  it('should delete goal 200', async () => {
    const res = await request(server.rawApp)
      .delete('/goals')
      .send({ id: goal.id })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map errors', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .delete('/goals')
      .send({ id: EntityId.create().value!.id })
      .expect(400);
  });
});
