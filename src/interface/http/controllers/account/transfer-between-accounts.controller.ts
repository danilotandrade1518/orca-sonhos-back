import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { TransferBetweenAccountsUseCase } from '@application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type TransferBetweenAccountsBody = {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
};

export class TransferBetweenAccountsController implements HttpController {
  constructor(private readonly useCase: TransferBetweenAccountsUseCase) {}

  async handle(
    request: HttpRequest<TransferBetweenAccountsBody>,
  ): Promise<HttpResponse> {
    const body = request.body;
    const result = await this.useCase.execute({
      userId: body.userId,
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      amount: body.amount,
      description: body.description,
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
