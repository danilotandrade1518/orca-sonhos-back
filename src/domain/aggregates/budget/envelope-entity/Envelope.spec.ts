import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { Envelope } from './Envelope';

const mockDto = () => ({
  name: 'Alimentação',
  limit: 1000,
  categoryId: EntityId.create().value?.id || '',
});

describe('Envelope', () => {
  it('deve criar um envelope válido', () => {
    const dto = mockDto();

    const result = Envelope.create(dto);

    expect(result.hasError).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Alimentação');
    expect(result.data?.limit).toBe(1000);
    expect(result.data?.categoryId).toBe(dto.categoryId);
  });

  it('deve acumular erro se o nome for vazio', () => {
    const dto = mockDto();
    dto.name = '';

    const result = Envelope.create(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
  });

  it('deve acumular erro se o limite for negativo', () => {
    const dto = mockDto();
    dto.limit = -100;

    const result = Envelope.create(dto);

    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e.message?.toLowerCase().includes('valor')),
    ).toBe(true);
  });

  it('deve acumular erro se o categoryId for inválido', () => {
    const dto = mockDto();
    dto.categoryId = 'invalid-category-id';

    const result = Envelope.create(dto);

    expect(result.hasError).toBe(true);
    expect(
      result.errors.some((e) => e.message?.toLowerCase().includes('id')),
    ).toBe(true);
  });
});
