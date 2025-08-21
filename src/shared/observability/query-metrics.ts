import { Counter, Histogram, Registry } from 'prom-client';

const registry = new Registry();

export const queriesTotal = new Counter({
  name: 'queries_total',
  help: 'Total de queries executadas',
  labelNames: ['query', 'success', 'http_status'],
  registers: [registry],
});

export const queryLatencyMs = new Histogram({
  name: 'query_latency_ms',
  help: 'Duração das queries em ms',
  labelNames: ['query'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [registry],
});

export function getQueryMetrics() {
  return registry.metrics();
}
