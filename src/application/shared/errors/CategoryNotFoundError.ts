import { ApplicationError } from './ApplicationError';

export class CategoryNotFoundError extends ApplicationError {
  constructor(message: string = 'Category not found') {
    super(message);
    this.name = 'CategoryNotFoundError';
  }
}
