import { IAddCategoryRepository } from '@application/contracts/repositories/category/IAddCategoryRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreateCategoryUseCase } from '@application/use-cases/category/create-category/CreateCategoryUseCase';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { CreateCategoryController } from '@http/controllers/category/create-category.controller';
import { RouteDefinition } from '@http/server-adapter';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

// Simple stub for repository
class AddCategoryRepositoryStub implements IAddCategoryRepository {
  public shouldFail = false;
  async execute(category: Category): Promise<Either<RepositoryError, void>> {
    if (this.shouldFail) {
      return Either.error<RepositoryError, void>(
        new RepositoryError('failed to add category'),
      );
    }
    // silence unused var if lint enforced
    void category;
    return Either.success<RepositoryError, void>(undefined);
  }
}

describe('POST /categories (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const addRepo = new AddCategoryRepositoryStub();
  const useCase = new CreateCategoryUseCase(addRepo);
  const controller = new CreateCategoryController(useCase);

  beforeAll(() => {
    const routes: RouteDefinition[] = [
      { method: 'POST', path: '/categories', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should create a category returning 201 and traceId', async () => {
    const res = await request(server.rawApp)
      .post('/categories')
      .send({
        name: 'Alimentação',
        type: 'EXPENSE',
        budgetId: EntityId.create().value!.id,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map domain/application errors to error response', async () => {
    addRepo.shouldFail = true;
    const res = await request(server.rawApp)
      .post('/categories')
      .send({
        name: 'X',
        type: 'EXPENSE',
        budgetId: EntityId.create().value!.id,
      })
      .expect(400);

    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
