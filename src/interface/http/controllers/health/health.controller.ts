import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

export class HealthController implements HttpController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    return {
      status: 200,
      body: {
        status: 'ok',
        traceId: request.requestId,
      },
    };
  }
}
