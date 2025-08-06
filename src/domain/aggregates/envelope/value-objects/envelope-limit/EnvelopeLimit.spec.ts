import { EnvelopeLimit } from './EnvelopeLimit';
import { InvalidEnvelopeLimitError } from '../../errors/InvalidEnvelopeLimitError';

describe('EnvelopeLimit Value Object', () => {
  describe('create', () => {
    it('should create envelope limit successfully with valid amount', () => {
      const result = EnvelopeLimit.create(50000);

      expect(result.hasError).toBe(false);
      expect(result.data!.value).toBe(50000);
    });

    it('should create envelope limit successfully with zero amount', () => {
      const result = EnvelopeLimit.create(0);

      expect(result.hasError).toBe(false);
      expect(result.data!.value).toBe(0);
    });

    it('should fail with negative amount', () => {
      const result = EnvelopeLimit.create(-100);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEnvelopeLimitError);
    });
  });
});
