import { ApplicationError } from './ApplicationError';

export class RepositoryError extends ApplicationError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
