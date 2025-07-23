import { Either } from '@either';
import { IUseCase } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { CreditCardBillUpdateFailedError } from '@application/shared/errors/CreditCardBillUpdateFailedError';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { ISaveCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';
import { DomainError } from '@domain/shared/DomainError';
import {
  UpdateCreditCardBillRequestDTO,
  UpdateCreditCardBillResponseDTO,
} from './UpdateCreditCardBillRequestDTO';

export class UpdateCreditCardBillUseCase
  implements IUseCase<UpdateCreditCardBillRequestDTO>
{
  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly saveCreditCardBillRepository: ISaveCreditCardBillRepository,
  ) {}

  async execute(
    request: UpdateCreditCardBillRequestDTO,
  ): Promise<
    Either<DomainError | ApplicationError, UpdateCreditCardBillResponseDTO>
  > {
    const billResult = await this.getCreditCardBillRepository.execute(
      request.id,
    );

    if (billResult.hasError) {
      const error = billResult.errors[0] as RepositoryError;
      return Either.error<
        DomainError | ApplicationError,
        UpdateCreditCardBillResponseDTO
      >(new CreditCardBillUpdateFailedError(error.message));
    }

    const bill = billResult.data;
    if (!bill) {
      return Either.error<
        DomainError | ApplicationError,
        UpdateCreditCardBillResponseDTO
      >(new CreditCardBillNotFoundError());
    }

    const updateResult = bill.update({
      closingDate: request.closingDate,
      dueDate: request.dueDate,
      amount: request.amount,
    });

    if (updateResult.hasError) {
      return Either.errors<
        DomainError | ApplicationError,
        UpdateCreditCardBillResponseDTO
      >(updateResult.errors);
    }

    const saveResult = await this.saveCreditCardBillRepository.execute(bill);

    if (saveResult.hasError) {
      const error = saveResult.errors[0] as RepositoryError;
      return Either.error<
        DomainError | ApplicationError,
        UpdateCreditCardBillResponseDTO
      >(new CreditCardBillUpdateFailedError(error.message));
    }

    return Either.success<
      DomainError | ApplicationError,
      UpdateCreditCardBillResponseDTO
    >({
      id: bill.id,
      creditCardId: bill.creditCardId,
      closingDate: bill.closingDate,
      dueDate: bill.dueDate,
      amount: bill.amount,
      status: bill.status,
      updatedAt: bill.updatedAt,
    });
  }
}
