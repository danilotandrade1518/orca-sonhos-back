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

    // Modo de desenvolvimento: quando AUTH_REQUIRED=false, aceitar tokens mock
    // Isso permite testes E2E sem autenticação real
    if (!required) {
      // UUIDs fixos para desenvolvimento/testes (devem ser UUIDs válidos)
      const MOCK_USER_IDS = {
        'mock-bearer-token': '123e4567-e89b-12d3-a456-426614174000', // mock-user-id
        'test-token': '00000000-0000-0000-0000-000000000002', // test-user-id
        'dev-token': '00000000-0000-0000-0000-000000000003', // dev-user-id
        default: '00000000-0000-0000-0000-000000000001', // dev-user-id padrão
      };

      // Se não há token, usar um principal padrão para desenvolvimento
      if (!authz) {
        req.principal = { userId: MOCK_USER_IDS.default };
        return next();
      }

      const [, token] = authz.split(' '); // Expecting 'Bearer <token>'

      // Se não há token após split, usar principal padrão
      if (!token) {
        req.principal = { userId: MOCK_USER_IDS.default };
        return next();
      }

      // Tokens mock comuns usados em desenvolvimento/testes
      if (token in MOCK_USER_IDS && token !== 'default') {
        // Usar UUID válido baseado no token mock
        const mockUserId = MOCK_USER_IDS[token as keyof typeof MOCK_USER_IDS];

        req.principal = { userId: mockUserId };
        incAuthSuccess();
        return next();
      }

      // Se não é um token mock conhecido, tentar validar como JWT real
      // Se falhar, usar principal padrão em modo desenvolvimento
      try {
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
      } catch {
        // Em modo desenvolvimento, se validação falhar, usar principal padrão
      }

      // Fallback: usar principal padrão em modo desenvolvimento
      req.principal = { userId: MOCK_USER_IDS.default };
      return next();
    }

    // Modo produção: autenticação obrigatória
    if (!authz) {
      incAuthFail('missing');
      throw new AuthTokenMissingError();
    }

    const [, token] = authz.split(' '); // Expecting 'Bearer <token>'
    if (!token) {
      incAuthFail('missing');
      throw new AuthTokenMissingError();
    }

    // Validação JWT real para produção
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
