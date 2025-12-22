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

    if (!required) {
      const MOCK_USER_IDS = {
        'mock-bearer-token': '123e4567-e89b-12d3-a456-426614174000',
        'test-token': '00000000-0000-0000-0000-000000000002',
        'dev-token': '00000000-0000-0000-0000-000000000003',
        default: '00000000-0000-0000-0000-000000000001',
      };

      if (!authz) {
        req.principal = { userId: MOCK_USER_IDS.default };
        return next();
      }

      const [, token] = authz.split(' ');

      if (!token) {
        req.principal = { userId: MOCK_USER_IDS.default };
        return next();
      }

      if (token in MOCK_USER_IDS && token !== 'default') {
        const mockUserId = MOCK_USER_IDS[token as keyof typeof MOCK_USER_IDS];

        req.principal = { userId: mockUserId };
        incAuthSuccess();
        return next();
      }

      const decodedResult = await validator.validate(token);
      if (!decodedResult.hasError) {
        const principalResult = await principalFactory.fromDecoded(
          decodedResult.data!,
        );
        if (!principalResult.hasError) {
          req.principal = { userId: principalResult.data!.userId };
          incAuthSuccess();
          return next();
        }
      }

      req.principal = { userId: MOCK_USER_IDS.default };
      return next();
    }

    if (!authz) {
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
