import { AddGoalRepositoryStub } from '@application/shared/tests/stubs/AddGoalRepositoryStub';
import { CreateGoalUseCase } from '@application/use-cases/goal/create-goal/CreateGoalUseCase';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreateGoalController } from '@http/controllers/goal/create-goal.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

describe('POST /goals (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const repo = new AddGoalRepositoryStub();
  const useCase = new CreateGoalUseCase(repo);
  const controller = new CreateGoalController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/goals', controller });
  });

  afterAll(async () => {
    await close();
  });

  it('should create goal 201', async () => {
    const res = await request(server.rawApp)
      .post('/goals')
      .send({
        name: 'Nova Meta',
        totalAmount: 1000,
        accumulatedAmount: 100,
        deadline: new Date().toISOString(),
        budgetId: EntityId.create().value!.id,
        sourceAccountId: EntityId.create().value!.id,
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should return error mapping', async () => {
    repo.shouldFail = true;
    const res = await request(server.rawApp)
      .post('/goals')
      .send({
        name: 'X',
        totalAmount: 10,
        budgetId: EntityId.create().value!.id,
      })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
