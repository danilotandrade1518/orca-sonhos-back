import { loadEnv } from '../../../../config/env';

describe('Env Category IDs', () => {
  it('should load default category ids when not provided', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      DB_HOST: 'h',
      DB_NAME: 'd',
      DB_USER: 'u',
      DB_PASSWORD: 'p',
    });

    expect(env.CATEGORY_ID_ADJUSTMENT).toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    expect(env.CATEGORY_ID_TRANSFER).toBe(
      '00000000-0000-0000-0000-000000000002',
    );
  });

  it('should accept custom category ids', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      DB_HOST: 'h',
      DB_NAME: 'd',
      DB_USER: 'u',
      DB_PASSWORD: 'p',
      CATEGORY_ID_ADJUSTMENT: '11111111-1111-1111-1111-111111111111',
      CATEGORY_ID_TRANSFER: '22222222-2222-2222-2222-222222222222',
    });

    expect(env.CATEGORY_ID_ADJUSTMENT).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(env.CATEGORY_ID_TRANSFER).toBe(
      '22222222-2222-2222-2222-222222222222',
    );
  });
});
