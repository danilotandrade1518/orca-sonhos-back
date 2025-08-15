import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { ReconcileAccountUseCase } from '@application/use-cases/account/reconcile-account/ReconcileAccountUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type ReconcileAccountBody = {
  userId: string;
  budgetId: string; // forwarded to use case
  accountId: string;
  realBalance: number;
};

export class ReconcileAccountController implements HttpController {
  constructor(private readonly useCase: ReconcileAccountUseCase) {}

  async handle(
    request: HttpRequest<ReconcileAccountBody>,
  ): Promise<HttpResponse> {
    const body = request.body;
    const result = await this.useCase.execute({
      userId: body.userId,
      budgetId: body.budgetId,
      accountId: body.accountId,
      realBalance: body.realBalance,
    });

    if (result.hasError)
      return DefaultResponseBuilder.errors(
        request.requestId,
        result.errors as (DomainError | ApplicationError)[],
      );

    return DefaultResponseBuilder.ok(request.requestId, {
      id: result.data?.id,
    });
  }
}
