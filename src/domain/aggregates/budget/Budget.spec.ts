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
    expect(budget.ownerId.equals(ownerId)).toBe(true);
    expect(budget.participantIds.length).toBe(2); // owner + extra
    expect(budget.participantIds.some((id) => id.equals(ownerId))).toBe(true);
    expect(
      budget.participantIds.some((id) => id.equals(participanteExtra)),
    ).toBe(true);
    expect(budget.createdAt).toBeInstanceOf(Date);
    expect(budget.updatedAt).toBeInstanceOf(Date);
  });

  it('deve adicionar um participante ao orçamento', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    const novoParticipante = EntityId.create();
    budget.adicionarParticipante(novoParticipante);
    expect(budget.participantIds.length).toBe(3);
    expect(
      budget.participantIds.some((id) => id.equals(novoParticipante)),
    ).toBe(true);
  });

  it('não deve adicionar o mesmo participante duas vezes', () => {
    const result = Budget.create(baseProps);
    const budget = result.data!;
    budget.adicionarParticipante(ownerId);
    expect(
      budget.participantIds.filter((id) => id.equals(ownerId)).length,
    ).toBe(1);
  });

  it('deve retornar erro se o nome for vazio', () => {
    const result = Budget.create({ ...baseProps, name: '' });
    expect(result.hasError).toBe(true);
    expect(result.errors[0].name).toBe('RequiredFieldError');
  });

  it('deve retornar erro se o ownerId for inválido', () => {
    const result = Budget.create({ ...baseProps, ownerId: 'id-invalido' });
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidEntityIdError('id-invalido'));
  });
});
