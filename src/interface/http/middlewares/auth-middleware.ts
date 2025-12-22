import { HttpMiddleware } from '../http-types';
import { IJwtValidator } from '../../../application/services/auth/IJwtValidator';
import { IPrincipalFactory } from '../../../application/services/auth/IPrincipalFactory';
import { AuthTokenMissingError } from '../../../application/shared/errors/AuthTokenMissingError';
import { AuthTokenInvalidError } from '../../../application/shared/errors/AuthTokenInvalidError';
import {
  incAuthFail,
  incAuthSuccess,
} from '@shared/observability/auth-metrics';

export function createAuthMiddleware(
  validator: IJwtValidator,
  principalFactory: IPrincipalFactory,
  required: boolean,
): HttpMiddleware {
  return async (req, next) => {
    const authz = req.headers['authorization'];
    if (!authz) {
      if (!required) return next();
      incAuthFail('missing');
      throw new AuthTokenMissingError();
    }
    const [, token] = authz.split(' ');
    if (!token) {
      incAuthFail('missing');
      throw new AuthTokenMissingError();
    }

    const decodedResult = await validator.validate(token);
    if (decodedResult.hasError) {
      const first = decodedResult.errors[0] as unknown as Error;
      incAuthFail('invalid');
      throw new AuthTokenInvalidError(first.message);
    }

    const principalResult = await principalFactory.fromDecoded(
      decodedResult.data!,
    );
    if (principalResult.hasError) {
      const first = principalResult.errors[0] as unknown as Error;
      incAuthFail('principal');
      throw new AuthTokenInvalidError(first.message);
    }

    req.principal = { userId: principalResult.data!.userId };
    incAuthSuccess();
    return next();
  };
}
