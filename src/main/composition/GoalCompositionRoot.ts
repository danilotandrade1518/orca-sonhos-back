import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { AddGoalRepository } from '@infrastructure/database/pg/repositories/goal/add-goal-repository/AddGoalRepository';
import { GetGoalByIdRepository } from '@infrastructure/database/pg/repositories/goal/get-goal-by-id-repository/GetGoalByIdRepository';
import { SaveGoalRepository } from '@infrastructure/database/pg/repositories/goal/save-goal-repository/SaveGoalRepository';
import { DeleteGoalRepository } from '@infrastructure/database/pg/repositories/goal/delete-goal-repository/DeleteGoalRepository';

import { CreateGoalUseCase } from '@application/use-cases/goal/create-goal/CreateGoalUseCase';
import { UpdateGoalUseCase } from '@application/use-cases/goal/update-goal/UpdateGoalUseCase';
import { AddAmountToGoalUseCase } from '@application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase';
import { DeleteGoalUseCase } from '@application/use-cases/goal/delete-goal/DeleteGoalUseCase';

export class GoalCompositionRoot {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  // Repositories
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

  // Use cases
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
    const getRepo = this.createGetGoalRepository();
    const saveRepo = this.createSaveGoalRepository();
    return new AddAmountToGoalUseCase(getRepo, saveRepo);
  }

  public createDeleteGoalUseCase(): DeleteGoalUseCase {
    const getRepo = this.createGetGoalRepository();
    const deleteRepo = this.createDeleteGoalRepository();
    return new DeleteGoalUseCase(getRepo, deleteRepo);
  }
}
