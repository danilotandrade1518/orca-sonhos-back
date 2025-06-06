import { InvalidEntityIdError } from '../../errors/InvalidEntityIdError';
import { EntityId } from './EntityId';

describe('EntityId', () => {
  it('deve criar um EntityId válido com UUID gerado', () => {
    const id = EntityId.create();
    expect(id.hasError).toBe(false);
    expect(id.value).not.toBeNull();
    expect(id.value?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('deve criar um EntityId válido a partir de string UUID', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const id = EntityId.fromString(uuid);
    expect(id.hasError).toBe(false);
    expect(id.value?.id).toBe(uuid);
  });

  it('deve retornar erro para string inválida', () => {
    const id = EntityId.fromString('id-invalido');
    expect(id.hasError).toBe(true);
    expect(id.errors[0]).toBeInstanceOf(InvalidEntityIdError);
  });

  it('dois EntityId com o mesmo valor devem ser iguais', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const id1 = EntityId.fromString(uuid);
    const id2 = EntityId.fromString(uuid);
    expect(id1.equals(id2)).toBe(true);
  });

  it('dois EntityId com valores diferentes não devem ser iguais', () => {
    const id1 = EntityId.create();
    const id2 = EntityId.create();
    expect(id1.equals(id2)).toBe(false);
  });
});
