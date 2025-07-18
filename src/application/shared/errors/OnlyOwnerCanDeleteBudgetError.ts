import { ApplicationError } from './ApplicationError';

export class OnlyOwnerCanDeleteBudgetError extends ApplicationError {
  constructor() {
    super('Only the budget owner can delete it');
  }
}
