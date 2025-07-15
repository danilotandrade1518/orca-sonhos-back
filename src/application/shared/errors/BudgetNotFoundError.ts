import { ApplicationError } from './ApplicationError';

export class BudgetNotFoundError extends ApplicationError {
  constructor() {
    super('Budget not found');
  }
}
