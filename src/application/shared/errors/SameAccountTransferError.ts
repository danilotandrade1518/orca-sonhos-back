import { ApplicationError } from './ApplicationError';

export class SameAccountTransferError extends ApplicationError {
  constructor() {
    super('Cannot transfer to the same account');
  }
}
