import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateTransactionUseCase } from '@application/use-cases/transaction/update-transaction/UpdateTransactionUseCase';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateTransactionBody {
  userId: string;
  id: string;
  description?: string;
  amount?: number;
  type?: TransactionTypeEnum;
  accountId?: string;
  categoryId?: string;
  transactionDate?: string;
}

export class UpdateTransactionController implements HttpController {
  constructor(private readonly useCase: UpdateTransactionUseCase) {}

  async handle(
    request: HttpRequest<UpdateTransactionBody>,
  ): Promise<HttpResponse> {
    const {
      userId,
      id,
      description,
      amount,
      type,
      accountId,
      categoryId,
      transactionDate,
    } = request.body;

    const result = await this.useCase.execute({
      userId,
      id,
      description,
      amount,
      type,
      accountId,
      categoryId,
      transactionDate: transactionDate ? new Date(transactionDate) : undefined,
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
