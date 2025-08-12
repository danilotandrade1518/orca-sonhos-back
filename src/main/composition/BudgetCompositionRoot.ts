import { CreateBudgetUseCase } from '@application/use-cases/budget/create-budget/CreateBudgetUseCase';
import { DeleteBudgetUseCase } from '@application/use-cases/budget/delete-budget/DeleteBudgetUseCase';
import { UpdateBudgetUseCase } from '@application/use-cases/budget/update-budget/UpdateBudgetUseCase';
import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';

import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { AddBudgetRepository } from '@infrastructure/database/pg/repositories/budget/add-budget-repository/AddBudgetRepository';
import { CheckBudgetDependenciesRepository } from '@infrastructure/database/pg/repositories/budget/check-budget-dependencies-repository/CheckBudgetDependenciesRepository';
import { DeleteBudgetRepository } from '@infrastructure/database/pg/repositories/budget/delete-budget-repository/DeleteBudgetRepository';
import { GetBudgetRepository } from '@infrastructure/database/pg/repositories/budget/get-budget-repository/GetBudgetRepository';
import { SaveBudgetRepository } from '@infrastructure/database/pg/repositories/budget/save-budget-repository/SaveBudgetRepository';

import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

import { makeCreateBudgetUseCase } from '../factories/use-cases/budget/make-create-budget-use-case';
import { makeDeleteBudgetUseCase } from '../factories/use-cases/budget/make-delete-budget-use-case';
import { makeUpdateBudgetUseCase } from '../factories/use-cases/budget/make-update-budget-use-case';
import { makeAddParticipantToBudgetUseCase } from '../factories/use-cases/budget/make-add-participant-to-budget-use-case';
import { makeRemoveParticipantFromBudgetUseCase } from '../factories/use-cases/budget/make-remove-participant-from-budget-use-case';

export class BudgetCompositionRoot {
  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  private createAddBudgetRepository(): AddBudgetRepository {
    return new AddBudgetRepository(this.connection);
  }

  private createGetBudgetRepository(): GetBudgetRepository {
    return new GetBudgetRepository(this.connection);
  }

  private createSaveBudgetRepository(): SaveBudgetRepository {
    return new SaveBudgetRepository(this.connection);
  }

  private createDeleteBudgetRepository(): DeleteBudgetRepository {
    return new DeleteBudgetRepository(this.connection);
  }

  private createCheckBudgetDependenciesRepository(): CheckBudgetDependenciesRepository {
    return new CheckBudgetDependenciesRepository(this.connection);
  }

  public createCreateBudgetUseCase(): CreateBudgetUseCase {
    const addBudgetRepository = this.createAddBudgetRepository();

    return makeCreateBudgetUseCase(addBudgetRepository);
  }

  public createUpdateBudgetUseCase(): UpdateBudgetUseCase {
    const getBudgetRepository = this.createGetBudgetRepository();
    const saveBudgetRepository = this.createSaveBudgetRepository();

    return makeUpdateBudgetUseCase(
      getBudgetRepository,
      saveBudgetRepository,
      this.budgetAuthorizationService,
    );
  }

  public createDeleteBudgetUseCase(): DeleteBudgetUseCase {
    const getBudgetRepository = this.createGetBudgetRepository();
    const deleteBudgetRepository = this.createDeleteBudgetRepository();
    const checkDependenciesRepository =
      this.createCheckBudgetDependenciesRepository();

    return makeDeleteBudgetUseCase(
      getBudgetRepository,
      deleteBudgetRepository,
      checkDependenciesRepository,
      this.budgetAuthorizationService,
    );
  }

  public createAddParticipantToBudgetUseCase(): AddParticipantToBudgetUseCase {
    const getBudgetRepository = this.createGetBudgetRepository();
    const saveBudgetRepository = this.createSaveBudgetRepository();

    return makeAddParticipantToBudgetUseCase(
      getBudgetRepository,
      saveBudgetRepository,
      this.budgetAuthorizationService,
    );
  }

  public createRemoveParticipantFromBudgetUseCase(): RemoveParticipantFromBudgetUseCase {
    const getBudgetRepository = this.createGetBudgetRepository();
    const saveBudgetRepository = this.createSaveBudgetRepository();

    return makeRemoveParticipantFromBudgetUseCase(
      getBudgetRepository,
      saveBudgetRepository,
      this.budgetAuthorizationService,
    );
  }
}
