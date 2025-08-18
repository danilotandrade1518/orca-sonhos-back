import { Either } from '@either';
import { ApplicationError } from '../../shared/errors/ApplicationError';
import { DecodedTokenPayload } from './IJwtValidator';

export interface Principal {
  userId: string;
  roles: string[];
  claims: Record<string, unknown>;
}

export interface IPrincipalFactory {
  fromDecoded(
    decoded: DecodedTokenPayload,
  ): Promise<Either<ApplicationError, Principal>>;
}
