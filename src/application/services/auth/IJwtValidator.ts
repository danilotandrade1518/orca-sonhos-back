import { Either } from '@either';
import { ApplicationError } from '../../shared/errors/ApplicationError';

export interface DecodedTokenPayload {
  userId: string;
  raw: Record<string, unknown>;
}

export interface IJwtValidator {
  validate(
    token: string,
  ): Promise<Either<ApplicationError, DecodedTokenPayload>>;
}
