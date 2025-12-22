import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

import { AddEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/add-envelope-repository/AddEnvelopeRepository';
import { GetEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/get-envelope-repository/GetEnvelopeRepository';
import { SaveEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/save-envelope-repository/SaveEnvelopeRepository';

import { CreateEnvelopeUseCase } from '@application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase';
import { UpdateEnvelopeUseCase } from '@application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase';
import { DeleteEnvelopeUseCase } from '@application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase';

export class EnvelopeCompositionRoot {
  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  private createAddEnvelopeRepository(): AddEnvelopeRepository {
    return new AddEnvelopeRepository(this.connection);
  }

  private createGetEnvelopeRepository(): GetEnvelopeRepository {
    return new GetEnvelopeRepository(this.connection);
  }

  private createSaveEnvelopeRepository(): SaveEnvelopeRepository {
    return new SaveEnvelopeRepository(this.connection);
  }

  public createCreateEnvelopeUseCase(): CreateEnvelopeUseCase {
    const addRepo = this.createAddEnvelopeRepository();
    return new CreateEnvelopeUseCase(addRepo, this.budgetAuthorizationService);
  }

  public createUpdateEnvelopeUseCase(): UpdateEnvelopeUseCase {
    const getRepo = this.createGetEnvelopeRepository();
    const saveRepo = this.createSaveEnvelopeRepository();
    return new UpdateEnvelopeUseCase(
      getRepo,
      saveRepo,
      this.budgetAuthorizationService,
    );
  }

  public createDeleteEnvelopeUseCase(): DeleteEnvelopeUseCase {
    const getRepo = this.createGetEnvelopeRepository();
    const saveRepo = this.createSaveEnvelopeRepository();
    return new DeleteEnvelopeUseCase(
      getRepo,
      saveRepo,
      this.budgetAuthorizationService,
    );
  }
}
