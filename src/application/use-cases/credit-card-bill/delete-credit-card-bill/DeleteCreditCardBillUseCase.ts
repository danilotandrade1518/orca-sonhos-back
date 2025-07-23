import { Either } from '@either';
import { IUseCase, UseCaseResponse } from '@application/shared/IUseCase';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { CreditCardBillDeletionFailedError } from '@application/shared/errors/CreditCardBillDeletionFailedError';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IDeleteCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IDeleteCreditCardBillRepository';
import { DomainError } from '@domain/shared/DomainError';
import { DeleteCreditCardBillRequestDTO } from './DeleteCreditCardBillRequestDTO';

export class DeleteCreditCardBillUseCase
  implements IUseCase<DeleteCreditCardBillRequestDTO>
{
  constructor(
    private readonly getCreditCardBillRepository: IGetCreditCardBillRepository,
    private readonly deleteCreditCardBillRepository: IDeleteCreditCardBillRepository,
  ) {}

  async execute(
    request: DeleteCreditCardBillRequestDTO,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const billResult = await this.getCreditCardBillRepository.execute(
      request.id,
    );

    if (billResult.hasError) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CreditCardBillDeletionFailedError(),
      );
    }

    const bill = billResult.data;
    if (!bill) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CreditCardBillNotFoundError(),
      );
    }

    const deleteResult = bill.delete();
    if (deleteResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        deleteResult.errors,
      );
    }

    const repositoryResult = await this.deleteCreditCardBillRepository.execute(
      request.id,
    );

    if (repositoryResult.hasError) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CreditCardBillDeletionFailedError(),
      );
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: bill.id,
    });
  }
}
