import { Either } from '@either';
import {
  IPrincipalFactory,
  Principal,
} from '../../application/services/auth/IPrincipalFactory';
import { DecodedTokenPayload } from '../../application/services/auth/IJwtValidator';
import { ApplicationError } from '../../application/shared/errors/ApplicationError';

export class PrincipalFactory implements IPrincipalFactory {
  async fromDecoded(
    decoded: DecodedTokenPayload,
  ): Promise<Either<ApplicationError, Principal>> {
    const roles = Array.isArray(decoded.raw['roles'])
      ? (decoded.raw['roles'] as string[])
      : [];
    return Either.success({
      userId: decoded.userId,
      roles,
      claims: decoded.raw,
    });
  }
}
