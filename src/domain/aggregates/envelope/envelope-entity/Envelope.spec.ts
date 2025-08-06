import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EnvelopeAlreadyDeletedError } from '../errors/EnvelopeAlreadyDeletedError';
import { InvalidEnvelopeLimitError } from '../errors/InvalidEnvelopeLimitError';
import { EnvelopeStatusEnum } from '../value-objects/envelope-status/EnvelopeStatus';
import { Envelope } from './Envelope';

describe('Envelope Entity', () => {
  const validEnvelopeData = {
    name: 'Alimentação',
    monthlyLimit: 50000,
    budgetId: EntityId.create().value!.id,
    categoryId: EntityId.create().value!.id,
  };

  describe('create', () => {
    it('should create envelope successfully', () => {
      const result = Envelope.create(validEnvelopeData);

      expect(result.hasError).toBe(false);
      expect(result.data!.name).toBe('Alimentação');
      expect(result.data!.monthlyLimit).toBe(50000);
      expect(result.data!.status).toBe(EnvelopeStatusEnum.ACTIVE);
      expect(result.data!.isDeleted).toBe(false);
    });

    it('should fail with empty name', () => {
      const result = Envelope.create({
        ...validEnvelopeData,
        name: '',
      });

      expect(result.hasError).toBe(true);
    });

    it('should fail with negative limit', () => {
      const result = Envelope.create({
        ...validEnvelopeData,
        monthlyLimit: -100,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEnvelopeLimitError);
    });

    it('should fail with invalid budget id', () => {
      const result = Envelope.create({
        ...validEnvelopeData,
        budgetId: '',
      });

      expect(result.hasError).toBe(true);
    });

    it('should fail with invalid category id', () => {
      const result = Envelope.create({
        ...validEnvelopeData,
        categoryId: 'invalid-uuid',
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('updateName', () => {
    it('should update name successfully', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.updateName('Nova Alimentação');

      expect(result.hasError).toBe(false);
      expect(envelope.name).toBe('Nova Alimentação');
    });

    it('should not change anything when name is the same', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      const originalUpdatedAt = envelope.updatedAt;

      const result = envelope.updateName('Alimentação');

      expect(result.hasError).toBe(false);
      expect(envelope.name).toBe('Alimentação');
      expect(envelope.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should fail with empty name', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.updateName('');

      expect(result.hasError).toBe(true);
    });

    it('should fail when envelope is deleted', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.delete();

      const result = envelope.updateName('Novo Nome');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeAlreadyDeletedError);
    });
  });

  describe('updateLimit', () => {
    it('should update limit successfully', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.updateLimit(75000);

      expect(result.hasError).toBe(false);
      expect(envelope.monthlyLimit).toBe(75000);
    });

    it('should not change anything when limit is the same', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      const originalUpdatedAt = envelope.updatedAt;

      const result = envelope.updateLimit(50000);

      expect(result.hasError).toBe(false);
      expect(envelope.monthlyLimit).toBe(50000);
      expect(envelope.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should fail with negative limit', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.updateLimit(-100);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEnvelopeLimitError);
    });

    it('should fail when envelope is deleted', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.delete();

      const result = envelope.updateLimit(75000);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeAlreadyDeletedError);
    });
  });

  describe('status management', () => {
    it('should pause envelope', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.pause();

      expect(result.hasError).toBe(false);
      expect(envelope.status).toBe(EnvelopeStatusEnum.PAUSED);
    });

    it('should activate envelope', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.pause();

      const result = envelope.activate();

      expect(result.hasError).toBe(false);
      expect(envelope.status).toBe(EnvelopeStatusEnum.ACTIVE);
    });

    it('should fail to pause when envelope is deleted', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.delete();

      const result = envelope.pause();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeAlreadyDeletedError);
    });

    it('should fail to activate when envelope is deleted', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.delete();

      const result = envelope.activate();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeAlreadyDeletedError);
    });
  });

  describe('delete', () => {
    it('should delete envelope successfully', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;

      const result = envelope.delete();

      expect(result.hasError).toBe(false);
      expect(envelope.isDeleted).toBe(true);
    });

    it('should fail when already deleted', () => {
      const envelope = Envelope.create(validEnvelopeData).data!;
      envelope.delete();

      const result = envelope.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeAlreadyDeletedError);
    });
  });

  describe('restore', () => {
    it('should restore envelope successfully', () => {
      const restoreData = {
        id: EntityId.create().value!.id,
        name: 'Envelope Restaurado',
        monthlyLimit: 30000,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        status: EnvelopeStatusEnum.ACTIVE,
        isDeleted: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const result = Envelope.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data!.name).toBe('Envelope Restaurado');
      expect(result.data!.monthlyLimit).toBe(30000);
      expect(result.data!.status).toBe(EnvelopeStatusEnum.ACTIVE);
      expect(result.data!.isDeleted).toBe(false);
      expect(result.data!.createdAt).toEqual(restoreData.createdAt);
      expect(result.data!.updatedAt).toEqual(restoreData.updatedAt);
    });

    it('should restore deleted envelope', () => {
      const restoreData = {
        id: EntityId.create().value!.id,
        name: 'Envelope Deletado',
        monthlyLimit: 25000,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        status: EnvelopeStatusEnum.ARCHIVED,
        isDeleted: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const result = Envelope.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
      expect(result.data!.status).toBe(EnvelopeStatusEnum.ARCHIVED);
    });

    it('should fail to restore with invalid data', () => {
      const restoreData = {
        id: '',
        name: '',
        monthlyLimit: -100,
        budgetId: '',
        categoryId: '',
        status: EnvelopeStatusEnum.ACTIVE,
        isDeleted: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const result = Envelope.restore(restoreData);

      expect(result.hasError).toBe(true);
    });
  });
});
