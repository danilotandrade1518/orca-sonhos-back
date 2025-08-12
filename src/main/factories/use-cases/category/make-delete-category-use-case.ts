import { DeleteCategoryUseCase } from '@application/use-cases/category/delete-category/DeleteCategoryUseCase';
import { IGetCategoryRepository } from '@application/contracts/repositories/category/IGetCategoryRepository';
import { ICheckCategoryDependenciesRepository } from '@application/contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '@application/contracts/repositories/category/IDeleteCategoryRepository';

export const makeDeleteCategoryUseCase = (
  getCategoryRepository: IGetCategoryRepository,
  checkDependenciesRepository: ICheckCategoryDependenciesRepository,
  deleteCategoryRepository: IDeleteCategoryRepository,
): DeleteCategoryUseCase => {
  return new DeleteCategoryUseCase(
    getCategoryRepository,
    checkDependenciesRepository,
    deleteCategoryRepository,
  );
};
