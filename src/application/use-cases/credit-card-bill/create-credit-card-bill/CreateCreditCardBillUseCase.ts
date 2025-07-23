import { Either } from '@either';
import { IUseCase } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillCreationFailedError } from '@application/shared/errors/CreditCardBillCreationFailedError';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { IAddCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IAddCreditCardBillRepository';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { DomainError } from '@domain/shared/DomainError';
import {
  CreateCreditCardBillRequestDTO,
  CreateCreditCardBillResponseDTO,
} from './CreateCreditCardBillRequestDTO';

export class CreateCreditCardBillUseCase
  implements IUseCase<CreateCreditCardBillRequestDTO>
{
  constructor(
    private readonly addCreditCardBillRepository: IAddCreditCardBillRepository,
  ) {}

  async execute(
    request: CreateCreditCardBillRequestDTO,
  ): Promise<
    Either<DomainError | ApplicationError, CreateCreditCardBillResponseDTO>
  > {
    const billOrError = CreditCardBill.create({
      creditCardId: request.creditCardId,
      closingDate: request.closingDate,
      dueDate: request.dueDate,
      amount: request.amount,
    });

    if (billOrError.hasError) {
      return Either.errors<
        DomainError | ApplicationError,
        CreateCreditCardBillResponseDTO
      >(billOrError.errors);
    }

    const bill = billOrError.data!;

    const result = await this.addCreditCardBillRepository.execute(bill);

    if (result.hasError) {
      const error = result.errors[0] as RepositoryError;
      return Either.error<
        DomainError | ApplicationError,
        CreateCreditCardBillResponseDTO
      >(new CreditCardBillCreationFailedError(error.message));
    }

    return Either.success<
      DomainError | ApplicationError,
      CreateCreditCardBillResponseDTO
    >({
      id: bill.id,
      creditCardId: bill.creditCardId,
      closingDate: bill.closingDate,
      dueDate: bill.dueDate,
      amount: bill.amount,
      status: bill.status,
      createdAt: bill.createdAt,
    });
  }
}
