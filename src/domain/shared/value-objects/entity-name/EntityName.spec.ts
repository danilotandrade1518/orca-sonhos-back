import { InvalidEntityNameError } from '../../errors/InvalidEntityNameError';
import { EntityName } from './EntityName';

describe('EntityName', () => {
  it('deve criar um EntityName válido', () => {
    const name = EntityName.create('Budget 2024');

    expect(name.hasError).toBe(false);
    expect(name.value?.name).toBe('Budget 2024');
  });

  it('deve retornar erro se o nome for vazio', () => {
    const name = EntityName.create('');

    expect(name.hasError).toBe(true);
    expect(name.errors[0]).toEqual(new InvalidEntityNameError(''));
  });

  it('deve retornar erro se o nome for muito curto', () => {
    const name = EntityName.create('A');

    expect(name.hasError).toBe(true);
    expect(name.errors[0]).toEqual(new InvalidEntityNameError('A'));
  });

  it('deve retornar erro se o nome for muito longo', () => {
    const longName = 'A'.repeat(51);

    const name = EntityName.create(longName);
    expect(name.hasError).toBe(true);
    expect(name.errors[0]).toEqual(new InvalidEntityNameError(longName));
  });

  it('deve retornar null em value se houver erro', () => {
    const name = EntityName.create('');

    expect(name.value).toBeNull();
  });

  it('equals deve retornar false se um dos lados tiver erro', () => {
    const n1 = EntityName.create('');
    const n2 = EntityName.create('Orçamento');

    expect(n1.equals(n2)).toBe(false);
  });

  it('dois EntityName com o mesmo valor devem ser iguais', () => {
    const n1 = EntityName.create('Orçamento');
    const n2 = EntityName.create('Orçamento');

    expect(n1.equals(n2)).toBe(true);
  });

  it('dois EntityName com valores diferentes não devem ser iguais', () => {
    const n1 = EntityName.create('Orçamento 1');
    const n2 = EntityName.create('Orçamento 2');

    expect(n1.equals(n2)).toBe(false);
  });
});
