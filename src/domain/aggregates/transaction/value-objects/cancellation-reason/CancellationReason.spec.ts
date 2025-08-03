import { InvalidCancellationReasonError } from '../../errors/InvalidCancellationReasonError';
import { CancellationReason } from './CancellationReason';

describe('CancellationReason', () => {
  describe('create', () => {
    it('should create a valid reason', () => {
      const result = CancellationReason.create('Change of plans');

      expect(result.hasError).toBe(false);
      expect(result.value?.reason).toBe('Change of plans');
    });

    it('should trim whitespace', () => {
      const result = CancellationReason.create('  Purchase cancelled  ');

      expect(result.hasError).toBe(false);
      expect(result.value?.reason).toBe('Purchase cancelled');
    });

    it('should return error for empty reason', () => {
      const result = CancellationReason.create('');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
    });

    it('should return error for whitespace only', () => {
      const result = CancellationReason.create('   ');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
    });

    it('should return error when too short', () => {
      const result = CancellationReason.create('ab');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
    });

    it('should return error when too long', () => {
      const long = 'a'.repeat(201);
      const result = CancellationReason.create(long);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
    });
  });
});
