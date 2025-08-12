import { CreateCategoryUseCase } from '@application/use-cases/category/create-category/CreateCategoryUseCase';
import { DeleteCategoryUseCase } from '@application/use-cases/category/delete-category/DeleteCategoryUseCase';
import { UpdateCategoryUseCase } from '@application/use-cases/category/update-category/UpdateCategoryUseCase';

import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { AddCategoryRepository } from '@infrastructure/database/pg/repositories/category/add-category-repository/AddCategoryRepository';
import { CheckCategoryDependenciesRepository } from '@infrastructure/database/pg/repositories/category/check-category-dependencies-repository/CheckCategoryDependenciesRepository';
import { DeleteCategoryRepository } from '@infrastructure/database/pg/repositories/category/delete-category-repository/DeleteCategoryRepository';
import { GetCategoryByIdRepository } from '@infrastructure/database/pg/repositories/category/get-category-by-id-repository/GetCategoryByIdRepository';
import { SaveCategoryRepository } from '@infrastructure/database/pg/repositories/category/save-category-repository/SaveCategoryRepository';

import { makeCreateCategoryUseCase } from '../factories/use-cases/category/make-create-category-use-case';
import { makeDeleteCategoryUseCase } from '../factories/use-cases/category/make-delete-category-use-case';
import { makeUpdateCategoryUseCase } from '../factories/use-cases/category/make-update-category-use-case';

export class CategoryCompositionRoot {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  private createAddCategoryRepository(): AddCategoryRepository {
    return new AddCategoryRepository(this.connection);
  }

  private createGetCategoryRepository(): GetCategoryByIdRepository {
    return new GetCategoryByIdRepository(this.connection);
  }

  private createSaveCategoryRepository(): SaveCategoryRepository {
    return new SaveCategoryRepository(this.connection);
  }

  private createDeleteCategoryRepository(): DeleteCategoryRepository {
    return new DeleteCategoryRepository(this.connection);
  }

  private createCheckCategoryDependenciesRepository(): CheckCategoryDependenciesRepository {
    return new CheckCategoryDependenciesRepository(this.connection);
  }

  public createCreateCategoryUseCase(): CreateCategoryUseCase {
    const addCategoryRepository = this.createAddCategoryRepository();

    return makeCreateCategoryUseCase(addCategoryRepository);
  }

  public createUpdateCategoryUseCase(): UpdateCategoryUseCase {
    const getCategoryRepository = this.createGetCategoryRepository();
    const saveCategoryRepository = this.createSaveCategoryRepository();

    return makeUpdateCategoryUseCase(
      getCategoryRepository,
      saveCategoryRepository,
    );
  }

  public createDeleteCategoryUseCase(): DeleteCategoryUseCase {
    const getCategoryRepository = this.createGetCategoryRepository();
    const deleteCategoryRepository = this.createDeleteCategoryRepository();
    const checkDependenciesRepository =
      this.createCheckCategoryDependenciesRepository();

    return makeDeleteCategoryUseCase(
      getCategoryRepository,
      checkDependenciesRepository,
      deleteCategoryRepository,
    );
  }
}
