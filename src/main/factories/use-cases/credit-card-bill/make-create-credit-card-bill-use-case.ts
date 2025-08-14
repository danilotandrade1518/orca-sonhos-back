import { CreateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase';
import { IAddCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IAddCreditCardBillRepository';

export const makeCreateCreditCardBillUseCase = (
  addCreditCardBillRepository: IAddCreditCardBillRepository,
): CreateCreditCardBillUseCase => {
  return new CreateCreditCardBillUseCase(addCreditCardBillRepository);
};
