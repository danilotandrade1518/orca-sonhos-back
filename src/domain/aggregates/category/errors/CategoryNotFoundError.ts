import { DomainError } from '../../../shared/DomainError';

export class CategoryNotFoundError extends DomainError {
  protected fieldName = 'category';

  constructor(message = 'Category not found') {
    super(message);
  }
}
