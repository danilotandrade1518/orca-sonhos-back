import { DomainError } from '../../../shared/DomainError';

export class InvalidReserveAmountError extends DomainError {
  protected fieldName: string = 'amount';

  constructor(
    message: string = 'Cannot remove more amount than currently reserved',
  ) {
    super(message);
  }
}
