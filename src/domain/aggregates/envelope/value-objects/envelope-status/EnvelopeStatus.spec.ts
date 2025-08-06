import { EnvelopeStatus, EnvelopeStatusEnum } from './EnvelopeStatus';

describe('EnvelopeStatus Value Object', () => {
  describe('create', () => {
    it('should create active status', () => {
      const status = EnvelopeStatus.create(EnvelopeStatusEnum.ACTIVE);

      expect(status.value).toBe(EnvelopeStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
      expect(status.isPaused()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });

    it('should create paused status', () => {
      const status = EnvelopeStatus.create(EnvelopeStatusEnum.PAUSED);

      expect(status.value).toBe(EnvelopeStatusEnum.PAUSED);
      expect(status.isActive()).toBe(false);
      expect(status.isPaused()).toBe(true);
      expect(status.isArchived()).toBe(false);
    });

    it('should create archived status', () => {
      const status = EnvelopeStatus.create(EnvelopeStatusEnum.ARCHIVED);

      expect(status.value).toBe(EnvelopeStatusEnum.ARCHIVED);
      expect(status.isActive()).toBe(false);
      expect(status.isPaused()).toBe(false);
      expect(status.isArchived()).toBe(true);
    });
  });
});
