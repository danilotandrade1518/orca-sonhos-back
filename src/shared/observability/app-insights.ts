import * as appInsights from 'applicationinsights';

interface MinimalEnv {
  APPINSIGHTS_CONNECTION_STRING?: string;
  APPINSIGHTS_ROLE_NAME?: string;
  APPINSIGHTS_SAMPLING_PERCENTAGE?: string;
  APPINSIGHTS_DISABLED?: string | boolean;
}

let started = false;

export function initAppInsights() {
  if (started) return appInsights;
  const env: MinimalEnv = process.env as MinimalEnv;
  const disabled =
    env.APPINSIGHTS_DISABLED === 'true' || env.APPINSIGHTS_DISABLED === true;
  if (disabled) return appInsights;
  if (!env.APPINSIGHTS_CONNECTION_STRING) return appInsights;

  appInsights
    .setup(env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectConsole(true, true)
    .setAutoCollectDependencies(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectRequests(true)
    .setAutoDependencyCorrelation(true)
    .setInternalLogging(false, false)
    .setSendLiveMetrics(false)
    .setUseDiskRetryCaching(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
    .start();

  if (env.APPINSIGHTS_SAMPLING_PERCENTAGE) {
    const client = appInsights.defaultClient;
    const pct = parseFloat(env.APPINSIGHTS_SAMPLING_PERCENTAGE);
    if (!Number.isNaN(pct) && pct >= 0 && pct <= 100) {
      client.config.samplingPercentage = pct;
    }
  }

  if (
    appInsights.defaultClient?.context?.tags &&
    appInsights.defaultClient?.context?.keys
  ) {
    const context = appInsights.defaultClient.context;
    context.tags[context.keys.cloudRole] =
      env.APPINSIGHTS_ROLE_NAME || 'orca-sonhos-api';
  }

  started = true;
  return appInsights;
}

export function getAppInsightsClient() {
  return appInsights.defaultClient;
}
