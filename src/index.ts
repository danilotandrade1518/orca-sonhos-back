import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { PostgresConnectionAdapter } from './adapters/postgres/PostgresConnectionAdapter';
import { IBudgetAuthorizationService } from './application/services/authorization/IBudgetAuthorizationService';
import { BudgetAuthorizationService } from './application/services/authorization/BudgetAuthorizationService';
import { GetBudgetRepository } from './infrastructure/database/pg/repositories/budget/get-budget-repository/GetBudgetRepository';
import { JwtValidator } from './infrastructure/auth/JwtValidator';
import { PrincipalFactory } from './infrastructure/auth/PrincipalFactory';
import { createAuthMiddleware } from './interface/http/middlewares/auth-middleware';
import { loadEnv } from './config/env';
import { DatabaseConfig } from './infrastructure/adapters/IPostgresConnectionAdapter';
import { registerMutationRoutes } from './main/routes/route-registry';
import swaggerDocument from './swagger.json';

dotenv.config();
const env = loadEnv();
process.env.TZ = 'UTC';

// Infra dependencies
const dbConfig: DatabaseConfig = {
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
};
const connection = new PostgresConnectionAdapter(dbConfig);

// Auth components (MVP)
const jwtValidator = new JwtValidator({
  jwksUri: env.AUTH_JWKS_URI,
  issuer: env.AUTH_ISSUER,
  audience: env.AUTH_AUDIENCE,
  userIdClaim: env.AUTH_USER_ID_CLAIM,
  required: env.AUTH_REQUIRED,
});
const principalFactory = new PrincipalFactory();
// Production budget authorization wired to real repository
const getBudgetRepository = new GetBudgetRepository(connection);
const authService: IBudgetAuthorizationService = new BudgetAuthorizationService(
  getBudgetRepository,
);

// Category IDs via env/config
const adjustmentCategoryId = env.CATEGORY_ID_ADJUSTMENT;
const transferCategoryId = env.CATEGORY_ID_TRANSFER;

// HTTP Server Adapter
const server = new ExpressHttpServerAdapter();

// Expose swagger through raw express app
server.rawApp.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);
server.rawApp.get('/', (_req, res) => {
  res.send('OrçaSonhos API rodando!');
});
// Attach auth middleware globally (non-required for now if AUTH_REQUIRED=false)
server.addGlobalMiddleware(
  createAuthMiddleware(jwtValidator, principalFactory, env.AUTH_REQUIRED),
);

registerMutationRoutes({
  server,
  connection,
  budgetAuthorizationService: authService,
  categoryIds: { adjustmentCategoryId, transferCategoryId },
});

server.listen(Number(env.HTTP_PORT), () => {
  console.log(`Servidor rodando na porta ${env.HTTP_PORT}`);
});
