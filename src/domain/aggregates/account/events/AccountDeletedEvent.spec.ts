import { AccountDeletedEvent } from './AccountDeletedEvent';
import { AccountTypeEnum } from '../value-objects/account-type/AccountType';

describe('AccountDeletedEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with all properties', () => {
    const event = new AccountDeletedEvent(
      'account-1',
      'budget-1',
      'Main',
      AccountTypeEnum.CHECKING_ACCOUNT,
      100,
      'desc',
    );

    expect(event.aggregateId).toBe('account-1');
    expect(event.budgetId).toBe('budget-1');
    expect(event.name).toBe('Main');
    expect(event.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
    expect(event.balance).toBe(100);
    expect(event.description).toBe('desc');
    expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });

  it('should allow undefined description', () => {
    const event = new AccountDeletedEvent(
      'account',
      'budget',
      'name',
      AccountTypeEnum.CHECKING_ACCOUNT,
      50,
    );
    expect(event.description).toBeUndefined();
  });
});
