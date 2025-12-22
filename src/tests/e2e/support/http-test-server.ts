import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { RouteDefinition } from '@http/server-adapter';

export interface CreatedTestServer {
  server: ExpressHttpServerAdapter;
  register: (...routes: RouteDefinition[]) => void;
  close: () => Promise<void>;
}

export function createHttpTestServer(): CreatedTestServer {
  const server = new ExpressHttpServerAdapter();

  const register = (...routes: RouteDefinition[]) => {
    server.registerRoutes(routes);
  };

  const close = async () => {
    await server.close();
    server.dispose();
  };

  return { server, register, close };
}
