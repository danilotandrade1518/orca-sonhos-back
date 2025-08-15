import request from 'supertest';
import crypto from 'node:crypto';
import { createHttpTestServer } from '../support/http-test-server';
import { RouteDefinition } from '@http/server-adapter';
import { UpdateCategoryController } from '@http/controllers/category/update-category.controller';
import { UpdateCategoryUseCase } from '@application/use-cases/category/update-category/UpdateCategoryUseCase';
import { IGetCategoryRepository } from '@application/contracts/repositories/category/IGetCategoryRepository';
import { ISaveCategoryRepository } from '@application/contracts/repositories/category/ISaveCategoryRepository';
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
class SaveCategoryRepoStub implements ISaveCategoryRepository {
  async execute(): Promise<Either<RepositoryError, void>> {
    return Either.success<RepositoryError, void>(undefined);
  }
}

describe('PATCH /categories (E2E)', () => {
  const { server, register, close } = createHttpTestServer();
  const getRepo = new GetCategoryRepoStub();
  const saveRepo = new SaveCategoryRepoStub();
  const useCase = new UpdateCategoryUseCase(getRepo, saveRepo);
  const controller = new UpdateCategoryController(useCase);

  beforeAll(() => {
    // prepare existing category with valid UUID budgetId
    const created = Category.create({
      name: 'Old',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: crypto.randomUUID(),
    });
    if (!created.hasError) getRepo.category = created.data!;

    const routes: RouteDefinition[] = [
      { method: 'PATCH', path: '/categories', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should update a category returning 200 and traceId', async () => {
    // ensure category exists
    if (!getRepo.category) {
      const created = Category.create({
        name: 'Old',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: crypto.randomUUID(),
      });
      if (!created.hasError) getRepo.category = created.data!;
    }
    const res = await request(server.rawApp)
      .patch('/categories')
      .send({ id: getRepo.category!.id, name: 'New Name', type: 'EXPENSE' })
      .expect(200);
    expect(res.body.id).toBe(getRepo.category!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 404 when category not found', async () => {
    getRepo.category = null;
    const missingId = crypto.randomUUID();
    const res = await request(server.rawApp)
      .patch('/categories')
      .send({ id: missingId, name: 'X', type: 'EXPENSE' })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});
