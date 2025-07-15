import { ApplicationError } from './ApplicationError';

export class BudgetRepositoryError extends ApplicationError {
  constructor() {
    super('Budget repository error');
  }
}
