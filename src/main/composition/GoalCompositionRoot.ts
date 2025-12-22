import { BudgetAuthorizationService } from '@application/services/authorization/BudgetAuthorizationService';
import { AddAmountToGoalUseCase } from '@application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase';
import { CreateGoalUseCase } from '@application/use-cases/goal/create-goal/CreateGoalUseCase';
import { DeleteGoalUseCase } from '@application/use-cases/goal/delete-goal/DeleteGoalUseCase';
import { RemoveAmountFromGoalUseCase } from '@application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalUseCase';
import { UpdateGoalUseCase } from '@application/use-cases/goal/update-goal/UpdateGoalUseCase';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { GetAccountRepository } from '@infrastructure/database/pg/repositories/account/get-account-repository/GetAccountRepository';
import { GetBudgetRepository } from '@infrastructure/database/pg/repositories/budget/get-budget-repository/GetBudgetRepository';
import { AddGoalRepository } from '@infrastructure/database/pg/repositories/goal/add-goal-repository/AddGoalRepository';
import { DeleteGoalRepository } from '@infrastructure/database/pg/repositories/goal/delete-goal-repository/DeleteGoalRepository';
import { GetGoalByIdRepository } from '@infrastructure/database/pg/repositories/goal/get-goal-by-id-repository/GetGoalByIdRepository';
import { GetGoalsByAccountRepository } from '@infrastructure/database/pg/repositories/goal/get-goals-by-account-repository/GetGoalsByAccountRepository';
import { SaveGoalRepository } from '@infrastructure/database/pg/repositories/goal/save-goal-repository/SaveGoalRepository';

export class GoalCompositionRoot {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  private createAddGoalRepository(): AddGoalRepository {
    return new AddGoalRepository(this.connection);
  }

  private createGetGoalRepository(): GetGoalByIdRepository {
    return new GetGoalByIdRepository(this.connection);
  }

  private createSaveGoalRepository(): SaveGoalRepository {
    return new SaveGoalRepository(this.connection);
  }

  private createDeleteGoalRepository(): DeleteGoalRepository {
    return new DeleteGoalRepository(this.connection);
  }

  private createGetAccountRepository(): GetAccountRepository {
    return new GetAccountRepository(this.connection);
  }

  private createGetGoalsByAccountRepository(): GetGoalsByAccountRepository {
    return new GetGoalsByAccountRepository(this.connection);
  }

  private createGetBudgetRepository(): GetBudgetRepository {
    return new GetBudgetRepository(this.connection);
  }

  private createBudgetAuthorizationService(): BudgetAuthorizationService {
    const getBudgetRepo = this.createGetBudgetRepository();
    return new BudgetAuthorizationService(getBudgetRepo);
  }

  public createCreateGoalUseCase(): CreateGoalUseCase {
    const addRepo = this.createAddGoalRepository();
    return new CreateGoalUseCase(addRepo);
  }

  public createUpdateGoalUseCase(): UpdateGoalUseCase {
    const getRepo = this.createGetGoalRepository();
    const saveRepo = this.createSaveGoalRepository();
    return new UpdateGoalUseCase(getRepo, saveRepo);
  }

  public createAddAmountToGoalUseCase(): AddAmountToGoalUseCase {
    const getGoalRepo = this.createGetGoalRepository();
    const getAccountRepo = this.createGetAccountRepository();
    const getGoalsByAccountRepo = this.createGetGoalsByAccountRepository();
    const saveGoalRepo = this.createSaveGoalRepository();
    const authService = this.createBudgetAuthorizationService();

    return new AddAmountToGoalUseCase(
      getGoalRepo,
      getAccountRepo,
      getGoalsByAccountRepo,
      saveGoalRepo,
      authService,
    );
  }

  public createRemoveAmountFromGoalUseCase(): RemoveAmountFromGoalUseCase {
    const getGoalRepo = this.createGetGoalRepository();
    const getAccountRepo = this.createGetAccountRepository();
    const saveGoalRepo = this.createSaveGoalRepository();
    const authService = this.createBudgetAuthorizationService();

    return new RemoveAmountFromGoalUseCase(
      getGoalRepo,
      getAccountRepo,
      saveGoalRepo,
      authService,
    );
  }

  public createDeleteGoalUseCase(): DeleteGoalUseCase {
    const getRepo = this.createGetGoalRepository();
    const deleteRepo = this.createDeleteGoalRepository();
    return new DeleteGoalUseCase(getRepo, deleteRepo);
  }
}
