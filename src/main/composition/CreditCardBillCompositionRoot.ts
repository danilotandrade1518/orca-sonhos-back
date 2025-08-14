import { IPayCreditCardBillUnitOfWork } from '@application/contracts/unit-of-works/IPayCreditCardBillUnitOfWork';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CreateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase';
import { DeleteCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase';
import { PayCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/pay-credit-card-bill/PayCreditCardBillUseCase';
import { ReopenCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase';
import { UpdateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { GetAccountRepository } from '@infrastructure/database/pg/repositories/account/get-account-repository/GetAccountRepository';
import { AddCreditCardBillRepository } from '@infrastructure/database/pg/repositories/credit-card-bill/add-credit-card-bill-repository/AddCreditCardBillRepository';
import { DeleteCreditCardBillRepository } from '@infrastructure/database/pg/repositories/credit-card-bill/delete-credit-card-bill-repository/DeleteCreditCardBillRepository';
import { GetCreditCardBillRepository } from '@infrastructure/database/pg/repositories/credit-card-bill/get-credit-card-bill-repository/GetCreditCardBillRepository';
import { SaveCreditCardBillRepository } from '@infrastructure/database/pg/repositories/credit-card-bill/save-credit-card-bill-repository/SaveCreditCardBillRepository';
import { GetCreditCardRepository } from '@infrastructure/database/pg/repositories/credit-card/get-credit-card-repository/GetCreditCardRepository';
import { PayCreditCardBillUnitOfWork } from '@infrastructure/database/pg/unit-of-works/pay-credit-card-bill/PayCreditCardBillUnitOfWork';

import { makeCreateCreditCardBillUseCase } from '../factories/use-cases/credit-card-bill/make-create-credit-card-bill-use-case';
import { makeDeleteCreditCardBillUseCase } from '../factories/use-cases/credit-card-bill/make-delete-credit-card-bill-use-case';
import { makePayCreditCardBillUseCase } from '../factories/use-cases/credit-card-bill/make-pay-credit-card-bill-use-case';
import { makeReopenCreditCardBillUseCase } from '../factories/use-cases/credit-card-bill/make-reopen-credit-card-bill-use-case';
import { makeUpdateCreditCardBillUseCase } from '../factories/use-cases/credit-card-bill/make-update-credit-card-bill-use-case';

export class CreditCardBillCompositionRoot {
  private readonly payCreditCardBillUnitOfWork: IPayCreditCardBillUnitOfWork;

  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {
    this.payCreditCardBillUnitOfWork = new PayCreditCardBillUnitOfWork(
      this.connection,
    );
  }

  // Repositories builders
  private createAddCreditCardBillRepository(): AddCreditCardBillRepository {
    return new AddCreditCardBillRepository(this.connection);
  }

  private createGetCreditCardBillRepository(): GetCreditCardBillRepository {
    return new GetCreditCardBillRepository(this.connection);
  }

  private createSaveCreditCardBillRepository(): SaveCreditCardBillRepository {
    return new SaveCreditCardBillRepository(this.connection);
  }

  private createDeleteCreditCardBillRepository(): DeleteCreditCardBillRepository {
    return new DeleteCreditCardBillRepository(this.connection);
  }

  private createGetAccountRepository(): GetAccountRepository {
    return new GetAccountRepository(this.connection);
  }

  private createGetCreditCardRepository(): GetCreditCardRepository {
    return new GetCreditCardRepository(this.connection);
  }

  // Use cases
  public createCreateCreditCardBillUseCase(): CreateCreditCardBillUseCase {
    const addRepo = this.createAddCreditCardBillRepository();
    return makeCreateCreditCardBillUseCase(addRepo);
  }

  public createUpdateCreditCardBillUseCase(): UpdateCreditCardBillUseCase {
    const getRepo = this.createGetCreditCardBillRepository();
    const saveRepo = this.createSaveCreditCardBillRepository();
    return makeUpdateCreditCardBillUseCase(getRepo, saveRepo);
  }

  public createDeleteCreditCardBillUseCase(): DeleteCreditCardBillUseCase {
    const getRepo = this.createGetCreditCardBillRepository();
    const deleteRepo = this.createDeleteCreditCardBillRepository();
    return makeDeleteCreditCardBillUseCase(getRepo, deleteRepo);
  }

  public createPayCreditCardBillUseCase(): PayCreditCardBillUseCase {
    const getBillRepo = this.createGetCreditCardBillRepository();
    const getAccountRepo = this.createGetAccountRepository();
    return makePayCreditCardBillUseCase(
      getBillRepo,
      getAccountRepo,
      this.payCreditCardBillUnitOfWork,
      this.budgetAuthorizationService,
    );
  }

  public createReopenCreditCardBillUseCase(): ReopenCreditCardBillUseCase {
    const getBillRepo = this.createGetCreditCardBillRepository();
    const saveBillRepo = this.createSaveCreditCardBillRepository();
    const getCardRepo = this.createGetCreditCardRepository();
    return makeReopenCreditCardBillUseCase(
      getBillRepo,
      saveBillRepo,
      getCardRepo,
      this.budgetAuthorizationService,
    );
  }
}
