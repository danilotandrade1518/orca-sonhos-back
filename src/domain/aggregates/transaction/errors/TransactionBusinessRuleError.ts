import { DomainError } from '../../../shared/domain-error';

export class TransactionBusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionBusinessRuleError';
  }
}
