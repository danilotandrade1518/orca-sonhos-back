import { DomainError } from '@domain/shared/domain-error';

export class RepositoryError extends DomainError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
