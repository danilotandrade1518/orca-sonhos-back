import { ApplicationError } from './ApplicationError';

export class InvalidTransferAmountError extends ApplicationError {
  constructor() {
    super('Transfer amount must be greater than zero');
  }
}
