import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

export class MeController implements HttpController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.principal) {
      return { status: 200, body: { anonymous: true } };
    }
    return {
      status: 200,
      body: {
        userId: request.principal.userId,
      },
    };
  }
}
