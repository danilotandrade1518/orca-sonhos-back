import { ApplicationError } from './ApplicationError';

export class ScheduledTransactionNotFoundError extends ApplicationError {
  constructor() {
    super('Scheduled transaction not found');
  }
}
