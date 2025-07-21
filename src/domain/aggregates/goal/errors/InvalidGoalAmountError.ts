import { DomainError } from '../../../shared/DomainError';

export class InvalidGoalAmountError extends DomainError {
  protected fieldName: string = 'amount';

  constructor(message: string = 'Invalid goal amount') {
    super(message);
  }
}
