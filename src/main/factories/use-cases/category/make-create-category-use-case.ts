import { CreateCategoryUseCase } from '@application/use-cases/category/create-category/CreateCategoryUseCase';
import { IAddCategoryRepository } from '@application/contracts/repositories/category/IAddCategoryRepository';

export const makeCreateCategoryUseCase = (
  addCategoryRepository: IAddCategoryRepository,
): CreateCategoryUseCase => {
  return new CreateCategoryUseCase(addCategoryRepository);
};
