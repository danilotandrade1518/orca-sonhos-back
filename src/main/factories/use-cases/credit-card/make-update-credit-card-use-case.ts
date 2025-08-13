import { UpdateCreditCardUseCase } from '@application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase';
import { IGetCreditCardRepository } from '@application/contracts/repositories/credit-card/IGetCreditCardRepository';
import { ISaveCreditCardRepository } from '@application/contracts/repositories/credit-card/ISaveCreditCardRepository';

export const makeUpdateCreditCardUseCase = (
  getCreditCardRepository: IGetCreditCardRepository,
  saveCreditCardRepository: ISaveCreditCardRepository,
): UpdateCreditCardUseCase => {
  return new UpdateCreditCardUseCase(
    getCreditCardRepository,
    saveCreditCardRepository,
  );
};
