import { ReopenCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { ISaveCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';
import { IGetCreditCardRepository } from '@application/contracts/repositories/credit-card/IGetCreditCardRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeReopenCreditCardBillUseCase = (
  getCreditCardBillRepository: IGetCreditCardBillRepository,
  saveCreditCardBillRepository: ISaveCreditCardBillRepository,
  getCreditCardRepository: IGetCreditCardRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): ReopenCreditCardBillUseCase => {
  return new ReopenCreditCardBillUseCase(
    getCreditCardBillRepository,
    saveCreditCardBillRepository,
    getCreditCardRepository,
    budgetAuthorizationService,
  );
};
