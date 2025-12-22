import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { checkDbConnection } from '../../../../infrastructure/database/pg/connection';

export class ReadyController implements HttpController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const dbOk = await checkDbConnection().catch(() => false);
    const allOk = dbOk;
    return {
      status: allOk ? 200 : 503,
      body: {
        status: allOk ? 'ready' : 'degraded',
        dependencies: { database: dbOk ? 'up' : 'down' },
        traceId: request.requestId,
      },
    };
  }
}
