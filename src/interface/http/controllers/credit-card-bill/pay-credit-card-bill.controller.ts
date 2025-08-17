import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { PayCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/pay-credit-card-bill/PayCreditCardBillUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface PayCreditCardBillBody {
  creditCardBillId: string;
  accountId: string;
  userId: string;
  budgetId: string;
  amount: number;
  paymentCategoryId: string;
  paidAt?: string;
}

export class PayCreditCardBillController implements HttpController {
  constructor(private readonly useCase: PayCreditCardBillUseCase) {}

  async handle(
    request: HttpRequest<PayCreditCardBillBody>,
  ): Promise<HttpResponse> {
    const {
      creditCardBillId,
      accountId,
      userId,
      budgetId,
      amount,
      paymentCategoryId,
      paidAt,
    } = request.body;

    const result = await this.useCase.execute({
      creditCardBillId,
      accountId,
      userId,
      budgetId,
      amount,
      paymentCategoryId,
      paidAt: paidAt ? new Date(paidAt) : undefined,
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
