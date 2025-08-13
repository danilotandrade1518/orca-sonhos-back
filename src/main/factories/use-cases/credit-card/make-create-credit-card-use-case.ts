import { CreateCreditCardUseCase } from '@application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase';
import { IAddCreditCardRepository } from '@application/contracts/repositories/credit-card/IAddCreditCardRepository';

export const makeCreateCreditCardUseCase = (
  addCreditCardRepository: IAddCreditCardRepository,
): CreateCreditCardUseCase => {
  return new CreateCreditCardUseCase(addCreditCardRepository);
};
