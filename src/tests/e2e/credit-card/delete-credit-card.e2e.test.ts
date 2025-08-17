import { IDeleteCreditCardRepository } from '@application/contracts/repositories/credit-card/IDeleteCreditCardRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { GetCreditCardRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardRepositoryStub';
import { DeleteCreditCardUseCase } from '@application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteCreditCardController } from '@http/controllers/credit-card/delete-credit-card.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeCard(): CreditCard {
  const id = EntityId.create().value!.id;
  const card: Partial<CreditCard> & { id: string } = {
    id,
    delete: () => Either.success(undefined),
  };
  return card as CreditCard;
}

class DeleteCreditCardRepoStub implements IDeleteCreditCardRepository {
  public shouldFail = false;
  async execute(id: string) {
    void id;
    if (this.shouldFail)
      return Either.error<RepositoryError, void>(
        new RepositoryError('delete fail'),
      );
    return Either.success<RepositoryError, void>(undefined);
  }
}

describe('DELETE /credit-cards (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const creditCard = makeCard();
  const getRepo = new GetCreditCardRepositoryStub();
  getRepo.mockCreditCard = creditCard;

  const delRepo = new DeleteCreditCardRepoStub();
  const useCase = new DeleteCreditCardUseCase(getRepo, delRepo);
  const controller = new DeleteCreditCardController(useCase);

  beforeAll(() => {
    register({ method: 'DELETE', path: '/credit-cards', controller });
  });
  afterAll(async () => close());

  it('should delete 200', async () => {
    const res = await request(server.rawApp)
      .delete('/credit-cards')
      .send({ id: creditCard.id })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .delete('/credit-cards')
      .send({ id: EntityId.create().value!.id })
      .expect(400);
  });
});
