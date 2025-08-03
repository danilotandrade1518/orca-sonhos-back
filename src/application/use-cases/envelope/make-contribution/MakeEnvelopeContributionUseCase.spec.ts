import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { ContributionSource } from '@domain/aggregates/envelope/value-objects/ContributionSource';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { SaveAccountRepositoryStub } from '../../../shared/tests/stubs/SaveAccountRepositoryStub';
import { EnvelopeRepositoryStub } from '../../../shared/tests/stubs/EnvelopeRepositoryStub';
import { MakeEnvelopeContributionDto } from './MakeEnvelopeContributionDto';
import { MakeEnvelopeContributionUseCase } from './MakeEnvelopeContributionUseCase';

const makeAccount = (budgetId: string) => {
  const result = Account.create({
    name: 'Conta',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    initialBalance: 1000,
  });
  if (result.hasError) throw new Error('invalid account');
  return result.data!;
};

const makeEnvelope = (budgetId: string) => {
  const result = Envelope.create({ budgetId, name: 'Env' });
  if (result.hasError) throw new Error('invalid envelope');
  return result.data!;
};

describe('MakeEnvelopeContributionUseCase', () => {
  it('should make manual contribution', async () => {
    const budgetId = EntityId.create().value!.id;
    const envelope = makeEnvelope(budgetId);
    const account = makeAccount(budgetId);
    const envelopeRepo = new EnvelopeRepositoryStub();
    envelopeRepo.envelope = envelope;
    const getAccountRepo = new GetAccountRepositoryStub();
    getAccountRepo.mockAccount = account;
    const saveAccountRepo = new SaveAccountRepositoryStub();
    const authService = new BudgetAuthorizationServiceStub();
    const publisher = new EventPublisherStub();
    const sut = new MakeEnvelopeContributionUseCase(
      envelopeRepo,
      getAccountRepo,
      saveAccountRepo,
      authService,
      publisher,
    );
    const dto: MakeEnvelopeContributionDto = {
      userId: EntityId.create().value!.id,
      budgetId,
      envelopeId: envelope.id,
      amount: 100,
      source: ContributionSource.MANUAL,
      sourceAccountId: account.id,
    };
    const result = await sut.execute(dto);
    expect(result.hasError).toBe(false);
    expect(envelope.balance).toBe(100);
    expect(account.balance).toBe(900);
    expect(publisher.publishManyCalls.length).toBe(1);
  });
});
