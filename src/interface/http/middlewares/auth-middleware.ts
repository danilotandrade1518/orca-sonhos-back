import { HttpMiddleware } from '../http-types';
import { IJwtValidator } from '../../../application/services/auth/IJwtValidator';
import { IPrincipalFactory } from '../../../application/services/auth/IPrincipalFactory';
import { AuthTokenMissingError } from '../../../application/shared/errors/AuthTokenMissingError';
import { AuthTokenInvalidError } from '../../../application/shared/errors/AuthTokenInvalidError';

export function createAuthMiddleware(
  validator: IJwtValidator,
  principalFactory: IPrincipalFactory,
  required: boolean,
): HttpMiddleware {
  return async (req, next) => {
    const authz = req.headers['authorization'];
    if (!authz) {
      if (!required) return next();
      throw new AuthTokenMissingError();
    }
    const [, token] = authz.split(' '); // Expecting 'Bearer <token>'
    if (!token) throw new AuthTokenMissingError();

    const decodedResult = await validator.validate(token);
    if (decodedResult.hasError) {
      const first = decodedResult.errors[0] as unknown as Error;
      throw new AuthTokenInvalidError(first.message);
    }

    const principalResult = await principalFactory.fromDecoded(
      decodedResult.data!,
    );
    if (principalResult.hasError) {
      const first = principalResult.errors[0] as unknown as Error;
      throw new AuthTokenInvalidError(first.message);
    }

    req.principal = { userId: principalResult.data!.userId };
    return next();
  };
}
