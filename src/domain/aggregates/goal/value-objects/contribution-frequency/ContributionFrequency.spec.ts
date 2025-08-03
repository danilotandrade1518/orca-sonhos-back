import { ContributionFrequency } from './ContributionFrequency';
import { FrequencyType } from '../../enums/FrequencyType';
import { InvalidFrequencyConfigurationError } from '../../errors/InvalidFrequencyConfigurationError';

describe('ContributionFrequency', () => {
  it('deve criar frequência mensal válida', () => {
    const freq = ContributionFrequency.create({
      type: FrequencyType.MONTHLY,
      executionDay: 10,
      interval: 1,
      startDate: new Date('2025-01-01'),
    });
    expect(freq.hasError).toBe(false);
    expect(freq.value?.type).toBe(FrequencyType.MONTHLY);
  });

  it('deve falhar se dia inválido para semanal', () => {
    const freq = ContributionFrequency.create({
      type: FrequencyType.WEEKLY,
      executionDay: 10,
      interval: 1,
      startDate: new Date('2025-01-01'),
    });
    expect(freq.hasError).toBe(true);
    expect(freq.errors[0]).toBeInstanceOf(InvalidFrequencyConfigurationError);
  });
});
