import { DeleteCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IDeleteCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IDeleteCreditCardBillRepository';

export const makeDeleteCreditCardBillUseCase = (
  getCreditCardBillRepository: IGetCreditCardBillRepository,
  deleteCreditCardBillRepository: IDeleteCreditCardBillRepository,
): DeleteCreditCardBillUseCase => {
  return new DeleteCreditCardBillUseCase(
    getCreditCardBillRepository,
    deleteCreditCardBillRepository,
  );
};
