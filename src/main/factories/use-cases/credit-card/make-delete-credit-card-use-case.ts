import { DeleteCreditCardUseCase } from '@application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase';
import { IGetCreditCardRepository } from '@application/contracts/repositories/credit-card/IGetCreditCardRepository';
import { IDeleteCreditCardRepository } from '@application/contracts/repositories/credit-card/IDeleteCreditCardRepository';

export const makeDeleteCreditCardUseCase = (
  getCreditCardRepository: IGetCreditCardRepository,
  deleteCreditCardRepository: IDeleteCreditCardRepository,
): DeleteCreditCardUseCase => {
  return new DeleteCreditCardUseCase(
    getCreditCardRepository,
    deleteCreditCardRepository,
  );
};
