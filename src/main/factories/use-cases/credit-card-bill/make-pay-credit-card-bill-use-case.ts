import { PayCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/pay-credit-card-bill/PayCreditCardBillUseCase';
import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { IPayCreditCardBillUnitOfWork } from '@application/contracts/unit-of-works/IPayCreditCardBillUnitOfWork';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makePayCreditCardBillUseCase = (
  getCreditCardBillRepository: IGetCreditCardBillRepository,
  getAccountRepository: IGetAccountRepository,
  payCreditCardBillUnitOfWork: IPayCreditCardBillUnitOfWork,
  budgetAuthorizationService: IBudgetAuthorizationService,
): PayCreditCardBillUseCase => {
  return new PayCreditCardBillUseCase(
    getCreditCardBillRepository,
    getAccountRepository,
    payCreditCardBillUnitOfWork,
    budgetAuthorizationService,
  );
};
