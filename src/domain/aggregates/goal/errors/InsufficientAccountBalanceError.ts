import { DomainError } from '../../../shared/DomainError';

export class InsufficientAccountBalanceError extends DomainError {
  protected fieldName: string = 'sourceAccount';

  constructor(
    message: string = 'Source account has insufficient balance for this goal operation',
  ) {
    super(message);
  }
}
