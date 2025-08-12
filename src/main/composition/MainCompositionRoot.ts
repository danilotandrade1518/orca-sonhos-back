import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { ITransferBetweenAccountsUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';

import { CategoryCompositionRoot } from './CategoryCompositionRoot';
import { BudgetCompositionRoot } from './BudgetCompositionRoot';
import { AccountCompositionRoot } from './AccountCompositionRoot';

export class MainCompositionRoot {
  private readonly categoryComposition: CategoryCompositionRoot;
  private readonly budgetComposition: BudgetCompositionRoot;
  private readonly accountComposition: AccountCompositionRoot;

  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly reconcileAccountUnitOfWork: IReconcileAccountUnitOfWork,
    private readonly transferUnitOfWork: ITransferBetweenAccountsUnitOfWork,
    private readonly adjustmentCategoryId: string,
    private readonly transferCategoryId: string,
  ) {
    this.categoryComposition = new CategoryCompositionRoot(this.connection);

    this.budgetComposition = new BudgetCompositionRoot(
      this.connection,
      this.budgetAuthorizationService,
    );

    this.accountComposition = new AccountCompositionRoot(
      this.connection,
      this.budgetAuthorizationService,
      this.reconcileAccountUnitOfWork,
      this.transferUnitOfWork,
      this.adjustmentCategoryId,
      this.transferCategoryId,
    );
  }

  public get category() {
    return {
      createCategory: () =>
        this.categoryComposition.createCreateCategoryUseCase(),
      updateCategory: () =>
        this.categoryComposition.createUpdateCategoryUseCase(),
      deleteCategory: () =>
        this.categoryComposition.createDeleteCategoryUseCase(),
    };
  }

  public get budget() {
    return {
      createBudget: () => this.budgetComposition.createCreateBudgetUseCase(),
      updateBudget: () => this.budgetComposition.createUpdateBudgetUseCase(),
      deleteBudget: () => this.budgetComposition.createDeleteBudgetUseCase(),
      addParticipant: () =>
        this.budgetComposition.createAddParticipantToBudgetUseCase(),
      removeParticipant: () =>
        this.budgetComposition.createRemoveParticipantFromBudgetUseCase(),
    };
  }

  public get account() {
    return {
      createAccount: () => this.accountComposition.createCreateAccountUseCase(),
      updateAccount: () => this.accountComposition.createUpdateAccountUseCase(),
      deleteAccount: () => this.accountComposition.createDeleteAccountUseCase(),
      reconcileAccount: () =>
        this.accountComposition.createReconcileAccountUseCase(),
      transferBetweenAccounts: () =>
        this.accountComposition.createTransferBetweenAccountsUseCase(),
    };
  }
}
