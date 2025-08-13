import { CreateCreditCardUseCase } from '@application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase';
import { DeleteCreditCardUseCase } from '@application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase';
import { UpdateCreditCardUseCase } from '@application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase';

import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { AddCreditCardRepository } from '@infrastructure/database/pg/repositories/credit-card/add-credit-card-repository/AddCreditCardRepository';
import { DeleteCreditCardRepository } from '@infrastructure/database/pg/repositories/credit-card/delete-credit-card-repository/DeleteCreditCardRepository';
import { GetCreditCardRepository } from '@infrastructure/database/pg/repositories/credit-card/get-credit-card-repository/GetCreditCardRepository';
import { SaveCreditCardRepository } from '@infrastructure/database/pg/repositories/credit-card/save-credit-card-repository/SaveCreditCardRepository';

import { makeCreateCreditCardUseCase } from '../factories/use-cases/credit-card/make-create-credit-card-use-case';
import { makeDeleteCreditCardUseCase } from '../factories/use-cases/credit-card/make-delete-credit-card-use-case';
import { makeUpdateCreditCardUseCase } from '../factories/use-cases/credit-card/make-update-credit-card-use-case';

export class CreditCardCompositionRoot {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  private createAddCreditCardRepository(): AddCreditCardRepository {
    return new AddCreditCardRepository(this.connection);
  }

  private createGetCreditCardRepository(): GetCreditCardRepository {
    return new GetCreditCardRepository(this.connection);
  }

  private createSaveCreditCardRepository(): SaveCreditCardRepository {
    return new SaveCreditCardRepository(this.connection);
  }

  private createDeleteCreditCardRepository(): DeleteCreditCardRepository {
    return new DeleteCreditCardRepository(this.connection);
  }

  public createCreateCreditCardUseCase(): CreateCreditCardUseCase {
    const addCreditCardRepository = this.createAddCreditCardRepository();

    return makeCreateCreditCardUseCase(addCreditCardRepository);
  }

  public createUpdateCreditCardUseCase(): UpdateCreditCardUseCase {
    const getCreditCardRepository = this.createGetCreditCardRepository();
    const saveCreditCardRepository = this.createSaveCreditCardRepository();

    return makeUpdateCreditCardUseCase(
      getCreditCardRepository,
      saveCreditCardRepository,
    );
  }

  public createDeleteCreditCardUseCase(): DeleteCreditCardUseCase {
    const getCreditCardRepository = this.createGetCreditCardRepository();
    const deleteCreditCardRepository = this.createDeleteCreditCardRepository();

    return makeDeleteCreditCardUseCase(
      getCreditCardRepository,
      deleteCreditCardRepository,
    );
  }
}
