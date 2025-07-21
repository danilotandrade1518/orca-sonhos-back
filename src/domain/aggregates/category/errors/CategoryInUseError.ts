import { DomainError } from '../../../shared/DomainError';

export class CategoryInUseError extends DomainError {
  protected fieldName = 'category';

  constructor(message = 'Category has related transactions') {
    super(message);
  }
}
