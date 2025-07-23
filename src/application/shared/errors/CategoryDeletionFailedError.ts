import { ApplicationError } from './ApplicationError';

export class CategoryDeletionFailedError extends ApplicationError {
  constructor(
    message: string = 'Category has dependencies and cannot be deleted',
  ) {
    super(message);
    this.name = 'CategoryDeletionFailedError';
  }
}
