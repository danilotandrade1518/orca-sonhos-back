import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { BudgetEnvelopes } from './BudgetEnvelopes';

describe('BudgetEnvelopes', () => {
  it('deve criar uma lista vazia de envelopes', () => {
    const result = BudgetEnvelopes.create({ envelopes: [] });
    expect(result.hasError).toBe(false);
    expect(result.data?.envelopes).toHaveLength(0);
  });

  it('deve criar uma lista com envelopes válidos', () => {
    const dto = {
      envelopes: [
        {
          name: 'Alimentação',
          limit: 1000,
          categoryId: EntityId.create().value?.id || '',
        },
        {
          name: 'Transporte',
          limit: 500,
          categoryId: EntityId.create().value?.id || '',
        },
      ],
    };
    const result = BudgetEnvelopes.create(dto);
    expect(result.hasError).toBe(false);
    expect(result.data?.envelopes).toHaveLength(2);
    expect(result.data?.envelopes[0].name).toBe('Alimentação');
    expect(result.data?.envelopes[1].name).toBe('Transporte');
  });

  it('deve acumular erro se algum envelope for inválido na criação', () => {
    const dto = {
      envelopes: [
        {
          name: '',
          limit: 1000,
          categoryId: EntityId.create().value?.id || '',
        },
        {
          name: 'Transporte',
          limit: -500,
          categoryId: EntityId.create().value?.id || '',
        },
      ],
    };
    const result = BudgetEnvelopes.create(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('deve adicionar envelope válido', () => {
    const budgetEnvelopes = BudgetEnvelopes.create({ envelopes: [] }).data!;
    const addResult = budgetEnvelopes.addEnvelope({
      name: 'Lazer',
      limit: 300,
      categoryId: EntityId.create().value?.id || '',
    });
    expect(addResult.hasError).toBe(false);
    expect(budgetEnvelopes.envelopes).toHaveLength(1);
    expect(budgetEnvelopes.envelopes[0].name).toBe('Lazer');
  });

  it('deve acumular erro ao adicionar envelope inválido', () => {
    const budgetEnvelopes = BudgetEnvelopes.create({ envelopes: [] }).data!;
    const addResult = budgetEnvelopes.addEnvelope({
      name: '',
      limit: 300,
      categoryId: EntityId.create().value?.id || '',
    });
    expect(addResult.hasError).toBe(true);
    expect(budgetEnvelopes.envelopes).toHaveLength(0);
  });

  it('deve remover envelope existente', () => {
    const dto = {
      envelopes: [
        {
          name: 'Alimentação',
          limit: 1000,
          categoryId: EntityId.create().value?.id || '',
        },
      ],
    };
    const budgetEnvelopes = BudgetEnvelopes.create(dto).data!;
    const envelopeId = budgetEnvelopes.envelopes[0].id;
    const removeResult = budgetEnvelopes.removeEnvelope(envelopeId);
    expect(removeResult.hasError).toBe(false);
    expect(budgetEnvelopes.envelopes).toHaveLength(0);
  });

  it('deve retornar erro ao tentar remover envelope inexistente', () => {
    const budgetEnvelopes = BudgetEnvelopes.create({ envelopes: [] }).data!;
    const removeResult = budgetEnvelopes.removeEnvelope('invalid-id');
    expect(removeResult.hasError).toBe(true);
    expect(removeResult.errors.some((e) => e instanceof NotFoundError)).toBe(
      true,
    );
  });
});
