import { resetEnvCache } from '../../../config/env';

// We import dynamically after manipulating env to ensure loadEnv sees new vars.

describe('initAppInsights', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    resetEnvCache();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('does not crash when no connection string provided', async () => {
    process.env.APPINSIGHTS_CONNECTION_STRING = '';
    const mod = await import('../../observability/app-insights');
    expect(() => mod.initAppInsights()).not.toThrow();
  });

  it('is idempotent (multiple calls safe)', async () => {
    process.env.APPINSIGHTS_CONNECTION_STRING = '';
    const mod = await import('../../observability/app-insights');
    mod.initAppInsights();
    expect(() => mod.initAppInsights()).not.toThrow();
  });
});
