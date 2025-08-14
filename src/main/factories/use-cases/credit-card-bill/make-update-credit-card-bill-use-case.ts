import { UpdateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { ISaveCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';

export const makeUpdateCreditCardBillUseCase = (
  getCreditCardBillRepository: IGetCreditCardBillRepository,
  saveCreditCardBillRepository: ISaveCreditCardBillRepository,
): UpdateCreditCardBillUseCase => {
  return new UpdateCreditCardBillUseCase(
    getCreditCardBillRepository,
    saveCreditCardBillRepository,
  );
};
