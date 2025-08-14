import { CreateAccountUseCase } from '@application/use-cases/account/create-account/CreateAccountUseCase';
import { DeleteAccountUseCase } from '@application/use-cases/account/delete-account/DeleteAccountUseCase';
import { UpdateAccountUseCase } from '@application/use-cases/account/update-account/UpdateAccountUseCase';
import { ReconcileAccountUseCase } from '@application/use-cases/account/reconcile-account/ReconcileAccountUseCase';
import { TransferBetweenAccountsUseCase } from '@application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase';

import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { AddAccountRepository } from '@infrastructure/database/pg/repositories/account/add-account-repository/AddAccountRepository';
import { CheckAccountDependenciesRepository } from '@infrastructure/database/pg/repositories/account/check-account-dependencies-repository/CheckAccountDependenciesRepository';
import { DeleteAccountRepository } from '@infrastructure/database/pg/repositories/account/delete-account-repository/DeleteAccountRepository';
import { GetAccountRepository } from '@infrastructure/database/pg/repositories/account/get-account-repository/GetAccountRepository';
import { SaveAccountRepository } from '@infrastructure/database/pg/repositories/account/save-account-repository/SaveAccountRepository';

import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { ITransferBetweenAccountsUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';
import { ReconcileAccountUnitOfWork } from '@infrastructure/database/pg/unit-of-works/reconcile-account/ReconcileAccountUnitOfWork';
import { TransferBetweenAccountsUnitOfWork } from '@infrastructure/database/pg/unit-of-works/transfer-between-accounts/TransferBetweenAccountsUnitOfWork';

import { makeCreateAccountUseCase } from '../factories/use-cases/account/make-create-account-use-case';
import { makeDeleteAccountUseCase } from '../factories/use-cases/account/make-delete-account-use-case';
import { makeUpdateAccountUseCase } from '../factories/use-cases/account/make-update-account-use-case';
import { makeReconcileAccountUseCase } from '../factories/use-cases/account/make-reconcile-account-use-case';
import { makeTransferBetweenAccountsUseCase } from '../factories/use-cases/account/make-transfer-between-accounts-use-case';

export class AccountCompositionRoot {
  private readonly reconcileAccountUnitOfWork: IReconcileAccountUnitOfWork;
  private readonly transferUnitOfWork: ITransferBetweenAccountsUnitOfWork;

  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly adjustmentCategoryId: string,
    private readonly transferCategoryId: string,
  ) {
    // Instantiate production unit of works
    this.reconcileAccountUnitOfWork = new ReconcileAccountUnitOfWork(
      this.connection,
    );
    this.transferUnitOfWork = new TransferBetweenAccountsUnitOfWork(
      this.connection,
    );
  }

  private createAddAccountRepository(): AddAccountRepository {
    return new AddAccountRepository(this.connection);
  }

  private createGetAccountRepository(): GetAccountRepository {
    return new GetAccountRepository(this.connection);
  }

  private createSaveAccountRepository(): SaveAccountRepository {
    return new SaveAccountRepository(this.connection);
  }

  private createDeleteAccountRepository(): DeleteAccountRepository {
    return new DeleteAccountRepository(this.connection);
  }

  private createCheckAccountDependenciesRepository(): CheckAccountDependenciesRepository {
    return new CheckAccountDependenciesRepository(this.connection);
  }

  public createCreateAccountUseCase(): CreateAccountUseCase {
    const addAccountRepository = this.createAddAccountRepository();

    return makeCreateAccountUseCase(
      addAccountRepository,
      this.budgetAuthorizationService,
    );
  }

  public createUpdateAccountUseCase(): UpdateAccountUseCase {
    const getAccountRepository = this.createGetAccountRepository();
    const saveAccountRepository = this.createSaveAccountRepository();

    return makeUpdateAccountUseCase(
      getAccountRepository,
      saveAccountRepository,
      this.budgetAuthorizationService,
    );
  }

  public createDeleteAccountUseCase(): DeleteAccountUseCase {
    const getAccountRepository = this.createGetAccountRepository();
    const deleteAccountRepository = this.createDeleteAccountRepository();
    const checkAccountDependenciesRepository =
      this.createCheckAccountDependenciesRepository();

    return makeDeleteAccountUseCase(
      getAccountRepository,
      deleteAccountRepository,
      checkAccountDependenciesRepository,
      this.budgetAuthorizationService,
    );
  }

  public createReconcileAccountUseCase(): ReconcileAccountUseCase {
    const getAccountRepository = this.createGetAccountRepository();

    return makeReconcileAccountUseCase(
      getAccountRepository,
      this.reconcileAccountUnitOfWork,
      this.budgetAuthorizationService,
      this.adjustmentCategoryId,
    );
  }

  public createTransferBetweenAccountsUseCase(): TransferBetweenAccountsUseCase {
    const getAccountRepository = this.createGetAccountRepository();

    return makeTransferBetweenAccountsUseCase(
      getAccountRepository,
      this.transferUnitOfWork,
      this.budgetAuthorizationService,
      this.transferCategoryId,
    );
  }
}
