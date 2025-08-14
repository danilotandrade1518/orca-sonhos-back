import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CancelScheduledTransactionUseCase } from '@application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase';
import { CreateTransactionUseCase } from '@application/use-cases/transaction/create-transaction/CreateTransactionUseCase';
import { DeleteTransactionUseCase } from '@application/use-cases/transaction/delete-transaction/DeleteTransactionUseCase';
import { MarkTransactionLateUseCase } from '@application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase';
import { UpdateTransactionUseCase } from '@application/use-cases/transaction/update-transaction/UpdateTransactionUseCase';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { GetAccountRepository } from '@infrastructure/database/pg/repositories/account/get-account-repository/GetAccountRepository';
import { AddTransactionRepository } from '@infrastructure/database/pg/repositories/transaction/add-transaction-repository/AddTransactionRepository';
import { DeleteTransactionRepository } from '@infrastructure/database/pg/repositories/transaction/delete-transaction-repository/DeleteTransactionRepository';
import { GetTransactionRepository } from '@infrastructure/database/pg/repositories/transaction/get-transaction-repository/GetTransactionRepository';
import { SaveTransactionRepository } from '@infrastructure/database/pg/repositories/transaction/save-transaction-repository/SaveTransactionRepository';

export class TransactionCompositionRoot {
  constructor(
    private readonly connection: IPostgresConnectionAdapter,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  // Repositories
  private createAddTransactionRepository() {
    return new AddTransactionRepository(this.connection);
  }

  private createGetTransactionRepository() {
    return new GetTransactionRepository(this.connection);
  }

  private createSaveTransactionRepository() {
    return new SaveTransactionRepository(this.connection);
  }

  private createDeleteTransactionRepository() {
    return new DeleteTransactionRepository(this.connection);
  }
  private createGetAccountRepository() {
    return new GetAccountRepository(this.connection);
  }

  // Use cases
  public createCreateTransactionUseCase() {
    return new CreateTransactionUseCase(
      this.createAddTransactionRepository(),
      this.createGetAccountRepository(),
      this.budgetAuthorizationService,
    );
  }

  public createUpdateTransactionUseCase() {
    return new UpdateTransactionUseCase(
      this.createGetTransactionRepository(),
      this.createSaveTransactionRepository(),
      this.createGetAccountRepository(),
      this.budgetAuthorizationService,
    );
  }

  public createDeleteTransactionUseCase() {
    return new DeleteTransactionUseCase(
      this.createGetTransactionRepository(),
      this.createDeleteTransactionRepository(),
      this.budgetAuthorizationService,
    );
  }

  public createCancelScheduledTransactionUseCase() {
    return new CancelScheduledTransactionUseCase(
      this.createGetTransactionRepository(),
      this.createSaveTransactionRepository(),
      this.budgetAuthorizationService,
    );
  }

  public createMarkTransactionLateUseCase() {
    return new MarkTransactionLateUseCase(
      this.createGetTransactionRepository(),
      this.createSaveTransactionRepository(),
    );
  }
}
