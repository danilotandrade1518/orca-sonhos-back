import { EntityId } from '../../shared/value-objects/entity-id/EntityId';
import { CannotRemoveOwnerFromParticipantsError } from './../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { InvalidEntityIdError } from './../../shared/errors/InvalidEntityIdError';
import { NotFoundError } from './../../shared/errors/NotFoundError';
import { Budget, CreateBudgetDTO } from './Budget';

describe('Budget (Orçamento)', () => {
  const ownerId = EntityId.create();
  const participanteExtra = EntityId.create();
  const baseProps: CreateBudgetDTO = {
    name: 'Orçamento Familiar',
    ownerId: ownerId.value?.id ?? '',
    participantIds: [participanteExtra.value?.id ?? ''],
  };

  it('deve criar um orçamento com os dados básicos', () => {
    const result = Budget.create(baseProps);
    expect(result.hasError).toBe(false);
    const budget = result.data!;
    expect(budget.name).toBe('Orçamento Familiar');
    expect(budget.ownerId).toBe(ownerId.value?.id ?? '');
    expect(budget.participantIds.length).toBe(2);
    expect(budget.participantIds).toContain(ownerId.value?.id ?? '');
    expect(budget.participantIds).toContain(participanteExtra.value?.id ?? '');
    expect(budget.createdAt).toBeInstanceOf(Date);
    expect(budget.updatedAt).toBeInstanceOf(Date);
  });

  it('deve adicionar um participante ao orçamento', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    const novoParticipante = EntityId.create();
    const addResult = budget.addParticipant(novoParticipante.value?.id ?? '');
    expect(addResult.hasError).toBe(false);
    expect(budget.participantIds.length).toBe(3);
    expect(budget.participantIds).toContain(novoParticipante.value?.id ?? '');
  });

  it('não deve adicionar o mesmo participante duas vezes', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    const addResult = budget.addParticipant(ownerId.value?.id ?? '');
    expect(addResult.hasError).toBe(false);
    expect(
      budget.participantIds.filter((id) => id === ownerId.value?.id).length,
    ).toBe(1);
  });

  it('deve retornar erro se o nome for vazio', () => {
    const result = Budget.create({ ...baseProps, name: '' });
    expect(result.hasError).toBe(true);
    expect(result.errors[0].name).toBe('InvalidEntityNameError');
  });

  it('deve retornar erro se o ownerId for inválido', () => {
    const result = Budget.create({ ...baseProps, ownerId: 'id-invalido' });
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    expect(result.errors[0].errorObj.field).toBe('id');
    expect(result.errors[0].errorObj.message).toMatch(/invalid/i);
  });

  it('deve retornar erro ao adicionar participante inválido', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    const addResult = budget.addParticipant('id-invalido');
    expect(addResult.hasError).toBe(true);
    expect(addResult.errors[0].name).toBe('InvalidEntityIdError');
  });

  it('deve retornar erro se algum participantId for inválido', () => {
    const result = Budget.create({
      ...baseProps,
      participantIds: ['id-invalido'],
    });
    expect(result.hasError).toBe(true);
    expect(result.errors[0].name).toBe('InvalidEntityIdError');
  });

  describe('removeParticipant', () => {
    let budget: Budget;
    let ownerId: string;
    let participantId: string;

    beforeEach(() => {
      ownerId = EntityId.create().value!.id;
      participantId = EntityId.create().value!.id;

      const either = Budget.create({
        name: 'Test Budget',
        ownerId,
        participantIds: [participantId],
      });

      if (either.hasError) {
        throw new Error('Failed to create budget for testing');
      }

      budget = either.data!;
    });

    it('should remove a participant successfully', () => {
      const result = budget.removeParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budget.participantIds).not.toContain(participantId);
      expect(budget.participantIds).toContain(ownerId);
    });

    it('should not allow removing the owner', () => {
      const result = budget.removeParticipant(ownerId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CannotRemoveOwnerFromParticipantsError,
      );
      expect(budget.participantIds).toContain(ownerId);
    });

    it('should return error when participant does not exist', () => {
      const nonExistentId = EntityId.create().value!.id;
      const result = budget.removeParticipant(nonExistentId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(NotFoundError);
      expect(result.errors[0].message).toBe('participantId not found');
    });

    it('should return error when participant id is invalid', () => {
      const invalidId = 'invalid-id-format';
      const result = budget.removeParticipant(invalidId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('should update the updatedAt timestamp after removing participant', () => {
      const oldUpdatedAt = budget.updatedAt;

      setTimeout(() => {
        const result = budget.removeParticipant(participantId);

        expect(result.hasError).toBe(false);
        expect(budget.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 1);
    });
  });
});
