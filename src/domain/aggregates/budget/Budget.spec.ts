import { EntityId } from '../../shared/value-objects/entity-id/EntityId';
import { InvalidEntityIdError } from './../../shared/errors/InvalidEntityIdError';
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
    const addResult = budget.adicionarParticipante(
      novoParticipante.value?.id ?? '',
    );
    expect(addResult.hasError).toBe(false);
    expect(budget.participantIds.length).toBe(3);
    expect(budget.participantIds).toContain(novoParticipante.value?.id ?? '');
  });

  it('não deve adicionar o mesmo participante duas vezes', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    const addResult = budget.adicionarParticipante(ownerId.value?.id ?? '');
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
    const addResult = budget.adicionarParticipante('id-invalido');
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
});
