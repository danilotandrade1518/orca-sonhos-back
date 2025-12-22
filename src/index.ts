import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { registerHealthRoutes } from '@main/routes/health-route-registry';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { PostgresConnectionAdapter } from './adapters/postgres/PostgresConnectionAdapter';
import { BudgetAuthorizationService } from './application/services/authorization/BudgetAuthorizationService';
import { IBudgetAuthorizationService } from './application/services/authorization/IBudgetAuthorizationService';
import { loadEnv } from './config/env';
import { DatabaseConfig } from './infrastructure/adapters/IPostgresConnectionAdapter';
import { JwtValidator } from './infrastructure/auth/JwtValidator';
import { PrincipalFactory } from './infrastructure/auth/PrincipalFactory';
import { GetBudgetRepository } from './infrastructure/database/pg/repositories/budget/get-budget-repository/GetBudgetRepository';
import { createAuthMiddleware } from './interface/http/middlewares/auth-middleware';
import { registerQueryRoutes } from './main/routes/query-route-registry';
import { registerMutationRoutes } from './main/routes/route-registry';
import { initAppInsights } from './shared/observability/app-insights';
import swaggerDocument from './swagger.json';

dotenv.config();
const env = loadEnv();
process.env.TZ = 'UTC';

initAppInsights();

const dbConfig: DatabaseConfig = {
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
};
const connection = new PostgresConnectionAdapter(dbConfig);

const jwtValidator = new JwtValidator({
  jwksUri: env.AUTH_JWKS_URI,
  issuer: env.AUTH_ISSUER,
  audience: env.AUTH_AUDIENCE,
  userIdClaim: env.AUTH_USER_ID_CLAIM,
  required: env.AUTH_REQUIRED,
});
const principalFactory = new PrincipalFactory();

const getBudgetRepository = new GetBudgetRepository(connection);
const authService: IBudgetAuthorizationService = new BudgetAuthorizationService(
  getBudgetRepository,
);

const adjustmentCategoryId = env.CATEGORY_ID_ADJUSTMENT;
const transferCategoryId = env.CATEGORY_ID_TRANSFER;

const server = new ExpressHttpServerAdapter();

server.rawApp.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);
server.rawApp.get('/', (_req, res) => {
  res.send('OrçaSonhos API rodando!');
});

server.addGlobalMiddleware(
  createAuthMiddleware(jwtValidator, principalFactory, env.AUTH_REQUIRED),
);

registerMutationRoutes({
  server,
  connection,
  budgetAuthorizationService: authService,
  categoryIds: { adjustmentCategoryId, transferCategoryId },
});

registerQueryRoutes({
  server,
  connection,
  budgetAuthorizationService: authService,
});

registerHealthRoutes(server);

server.listen(Number(env.HTTP_PORT), () => {
  console.log(`Servidor rodando na porta ${env.HTTP_PORT}`);
});
