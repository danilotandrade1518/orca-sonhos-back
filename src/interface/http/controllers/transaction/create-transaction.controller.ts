import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction/CreateTransactionUseCase';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateTransactionBody {
  userId: string;
  description: string;
  amount: number;
  type: TransactionTypeEnum;
  accountId: string;
  categoryId: string;
  budgetId: string;
  transactionDate?: string;
}

export class CreateTransactionController implements HttpController {
  constructor(private readonly useCase: CreateTransactionUseCase) {}

  async handle(
    request: HttpRequest<CreateTransactionBody>,
  ): Promise<HttpResponse> {
    const {
      userId,
      description,
      amount,
      type,
      accountId,
      categoryId,
      budgetId,
      transactionDate,
    } = request.body;

    const result = await this.useCase.execute({
      userId,
      description,
      amount,
      type,
      accountId,
      categoryId,
      budgetId,
      transactionDate: transactionDate ? new Date(transactionDate) : undefined,
    });

    if (result.hasError)
      return DefaultResponseBuilder.errors(
        request.requestId,
        result.errors as (DomainError | ApplicationError)[],
      );

    return DefaultResponseBuilder.created(request.requestId, {
      id: result.data?.id,
    });
  }
}
