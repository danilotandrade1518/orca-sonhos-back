import { ContributionFrequency } from '../contribution-frequency/ContributionFrequency';
import { FrequencyType } from '../../enums/FrequencyType';
import { AutomaticContribution } from './AutomaticContribution';
import { InvalidContributionAmountError } from '../../errors/InvalidContributionAmountError';
import { InvalidStartDateError } from '../../errors/InvalidStartDateError';

const makeFrequency = () =>
  ContributionFrequency.create({
    type: FrequencyType.MONTHLY,
    executionDay: 15,
    interval: 1,
    startDate: new Date(Date.now() + 86400000),
  });

describe('AutomaticContribution', () => {
  it('deve criar valor válido', () => {
    const freq = makeFrequency();
    const result = AutomaticContribution.create({
      amount: 1000,
      frequency: freq,
      sourceAccountId: '550e8400-e29b-41d4-a716-446655440001',
      startDate: new Date(Date.now() + 86400000),
      isActive: true,
    });
    expect(result.hasError).toBe(false);
    expect(result.value?.amount).toBe(1000);
  });

  it('deve retornar erro se valor for zero ou negativo', () => {
    const freq = makeFrequency();
    const result = AutomaticContribution.create({
      amount: 0,
      frequency: freq,
      sourceAccountId: '550e8400-e29b-41d4-a716-446655440001',
      startDate: new Date(Date.now() + 86400000),
      isActive: true,
    });
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InvalidContributionAmountError);
  });

  it('deve retornar erro se startDate estiver no passado', () => {
    const freq = makeFrequency();
    const result = AutomaticContribution.create({
      amount: 100,
      frequency: freq,
      sourceAccountId: '550e8400-e29b-41d4-a716-446655440001',
      startDate: new Date(Date.now() - 86400000),
      isActive: true,
    });
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InvalidStartDateError);
  });
});
