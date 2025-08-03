import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';

import { IGetCategoryByIdRepository } from '../../../contracts/repositories/category/IGetCategoryByIdRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetCategoryByIdRepositoryStub implements IGetCategoryByIdRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public executeCalls: string[] = [];
  public mockCategory: Category | null = null;

  async execute(categoryId: string): Promise<Either<RepositoryError, Category | null>> {
    this.executeCalls.push(categoryId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    return Either.success(this.mockCategory);
  }
}

