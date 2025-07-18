import { ApplicationError } from './ApplicationError';

export class BudgetPersistenceFailedError extends ApplicationError {
  constructor() {
    super('Failed to persist budget changes');
  }
}
