import { DomainError } from '../../../shared/DomainError';

export class BudgetAlreadyDeletedError extends DomainError {
  constructor() {
    super('Budget is already deleted');
  }
}
