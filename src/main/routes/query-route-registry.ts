// Registry de rotas de queries (views/read)
import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';

// Dependências a serem injetadas (DAOs, serviços, etc.)
export interface QueryRegistryDeps {
  server: ExpressHttpServerAdapter;
  // Exemplo: listBudgetsDao: IListBudgetsDao
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function registerQueryRoutes(deps: QueryRegistryDeps) {
  // const { server } = deps;
  // const app = server.rawApp;
  // Exemplo de uso futuro:
  // app.get('/budgets', async (req, res) => { ... });
  // app.get('/accounts', ...)
  // Por ora, apenas placeholder
}
