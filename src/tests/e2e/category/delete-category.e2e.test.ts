import request from 'supertest';
import crypto from 'node:crypto';
import { createHttpTestServer } from '../support/http-test-server';
import { RouteDefinition } from '@http/server-adapter';
import { DeleteCategoryController } from '@http/controllers/category/delete-category.controller';
import { DeleteCategoryUseCase } from '@application/use-cases/category/delete-category/DeleteCategoryUseCase';
import { IGetCategoryRepository } from '@application/contracts/repositories/category/IGetCategoryRepository';
import { ICheckCategoryDependenciesRepository } from '@application/contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '@application/contracts/repositories/category/IDeleteCategoryRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { Either } from '@either';

class GetCategoryRepoStub implements IGetCategoryRepository {
  public category: Category | null = null;
  public returnError = false;
  async execute(): Promise<Either<RepositoryError, Category | null>> {
    if (this.returnError)
      return Either.error<RepositoryError, Category | null>(
        new RepositoryError('repo fail'),
      );
    if (this.category)
      return Either.success<RepositoryError, Category | null>(this.category);
    return Either.success<RepositoryError, Category | null>(null);
  }
}
class CheckDepsRepoStub implements ICheckCategoryDependenciesRepository {
  public hasDeps = false;
  async execute(): Promise<Either<RepositoryError, boolean>> {
    return Either.success<RepositoryError, boolean>(this.hasDeps);
  }
}
class DeleteCategoryRepoStub implements IDeleteCategoryRepository {
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

describe('DELETE /categories (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const getRepo = new GetCategoryRepoStub();
  const depsRepo = new CheckDepsRepoStub();
  const delRepo = new DeleteCategoryRepoStub();
  const useCase = new DeleteCategoryUseCase(getRepo, depsRepo, delRepo);
  const controller = new DeleteCategoryController(useCase);

  beforeAll(() => {
    const created = Category.create({
      name: 'Food',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: crypto.randomUUID(),
    });
    if (!created.hasError) getRepo.category = created.data!;

    const routes: RouteDefinition[] = [
      { method: 'DELETE', path: '/categories', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should delete category returning 200 and traceId', async () => {
    if (!getRepo.category) {
      const created = Category.create({
        name: 'Food',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: crypto.randomUUID(),
      });
      if (!created.hasError) getRepo.category = created.data!;
    }
    const categoryId = getRepo.category!.id;
    const res = await request(server.rawApp)
      .delete('/categories')
      .send({ id: categoryId })
      .expect(200);
    expect(res.body.id).toBe(categoryId);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 404 when not found', async () => {
    getRepo.category = null;
    const missingId = crypto.randomUUID();
    const res = await request(server.rawApp)
      .delete('/categories')
      .send({ id: missingId })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('should return 400 when has dependencies', async () => {
    const created = Category.create({
      name: 'Temp',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: crypto.randomUUID(),
    });
    if (!created.hasError) getRepo.category = created.data!;
    depsRepo.hasDeps = true;
    const res = await request(server.rawApp)
      .delete('/categories')
      .send({ id: getRepo.category!.id })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
