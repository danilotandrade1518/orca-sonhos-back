import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

import { AddEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/add-envelope-repository/AddEnvelopeRepository';
import { GetEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/get-envelope-repository/GetEnvelopeRepository';
import { SaveEnvelopeRepository } from '@infrastructure/database/pg/repositories/envelope/save-envelope-repository/SaveEnvelopeRepository';
import { TransferBetweenEnvelopesUnitOfWork } from '@infrastructure/database/pg/unit-of-works/transfer-between-envelopes/TransferBetweenEnvelopesUnitOfWork';

import { CreateEnvelopeUseCase } from '@application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase';
import { UpdateEnvelopeUseCase } from '@application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase';
import { DeleteEnvelopeUseCase } from '@application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase';
import { AddAmountToEnvelopeUseCase } from '@application/use-cases/envelope/add-amount-to-envelope/AddAmountToEnvelopeUseCase';
import { RemoveAmountFromEnvelopeUseCase } from '@application/use-cases/envelope/remove-amount-from-envelope/RemoveAmountFromEnvelopeUseCase';
import { TransferBetweenEnvelopesUseCase } from '@application/use-cases/envelope/transfer-between-envelopes/TransferBetweenEnvelopesUseCase';
import { TransferBetweenEnvelopesService } from '@domain/aggregates/envelope/services/TransferBetweenEnvelopesService';

export class EnvelopeCompositionRoot {
  private readonly transferUnitOfWork: TransferBetweenEnvelopesUnitOfWork;

  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {
    this.transferUnitOfWork = new TransferBetweenEnvelopesUnitOfWork(
      this.connection,
    );
  }

  // Repositories
  private createAddEnvelopeRepository(): AddEnvelopeRepository {
    return new AddEnvelopeRepository(this.connection);
  }

  private createGetEnvelopeRepository(): GetEnvelopeRepository {
    return new GetEnvelopeRepository(this.connection);
  }

  private createSaveEnvelopeRepository(): SaveEnvelopeRepository {
    return new SaveEnvelopeRepository(this.connection);
  }

  // Use cases
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

  public createAddAmountToEnvelopeUseCase(): AddAmountToEnvelopeUseCase {
    const getRepo = this.createGetEnvelopeRepository();
    const saveRepo = this.createSaveEnvelopeRepository();
    return new AddAmountToEnvelopeUseCase(
      getRepo,
      saveRepo,
      this.budgetAuthorizationService,
    );
  }

  public createRemoveAmountFromEnvelopeUseCase(): RemoveAmountFromEnvelopeUseCase {
    const getRepo = this.createGetEnvelopeRepository();
    const saveRepo = this.createSaveEnvelopeRepository();
    return new RemoveAmountFromEnvelopeUseCase(
      getRepo,
      saveRepo,
      this.budgetAuthorizationService,
    );
  }

  public createTransferBetweenEnvelopesUseCase(): TransferBetweenEnvelopesUseCase {
    const getRepo = this.createGetEnvelopeRepository();
    const transferService = new TransferBetweenEnvelopesService();
    return new TransferBetweenEnvelopesUseCase(
      getRepo,
      transferService,
      this.transferUnitOfWork,
      this.budgetAuthorizationService,
    );
  }
}
