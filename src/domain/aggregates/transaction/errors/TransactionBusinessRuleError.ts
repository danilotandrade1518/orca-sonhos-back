import { DomainError } from '../../../shared/DomainError';

export class TransactionBusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionBusinessRuleError';
  }
}
