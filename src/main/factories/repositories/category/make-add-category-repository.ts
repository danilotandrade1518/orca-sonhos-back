import { AddCategoryRepository } from '@infrastructure/database/pg/repositories/category/add-category-repository/AddCategoryRepository';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

export const makeAddCategoryRepository = (
  connection: IPostgresConnectionAdapter,
): AddCategoryRepository => {
  return new AddCategoryRepository(connection);
};
