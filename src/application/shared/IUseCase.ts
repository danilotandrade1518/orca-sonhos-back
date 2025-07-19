import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { ApplicationError } from './errors/ApplicationError';

export type UseCaseResponse = { id: string };

export interface IUseCase<TRequest> {
  execute(
    request: TRequest,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>>;
}
