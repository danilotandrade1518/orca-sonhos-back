import { UpdateCategoryUseCase } from '@application/use-cases/category/update-category/UpdateCategoryUseCase';
import { IGetCategoryRepository } from '@application/contracts/repositories/category/IGetCategoryRepository';
import { ISaveCategoryRepository } from '@application/contracts/repositories/category/ISaveCategoryRepository';

export const makeUpdateCategoryUseCase = (
  getCategoryRepository: IGetCategoryRepository,
  saveCategoryRepository: ISaveCategoryRepository,
): UpdateCategoryUseCase => {
  return new UpdateCategoryUseCase(
    getCategoryRepository,
    saveCategoryRepository,
  );
};
