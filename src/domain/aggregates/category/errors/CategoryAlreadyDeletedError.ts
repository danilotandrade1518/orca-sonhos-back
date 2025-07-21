import { DomainError } from '../../../shared/DomainError';

export class CategoryAlreadyDeletedError extends DomainError {
  protected fieldName = 'category';

  constructor(message = 'Category is already deleted') {
    super(message);
  }
}
