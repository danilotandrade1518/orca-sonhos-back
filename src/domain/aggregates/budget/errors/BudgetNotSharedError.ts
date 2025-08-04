import { DomainError } from '../../../shared/DomainError';

export class BudgetNotSharedError extends DomainError {
  constructor() {
    super('Cannot add participants to a personal budget');
    this.name = 'BudgetNotSharedError';
  }
}
