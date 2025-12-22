type Outcome = 'success' | 'error';

interface MutationCounters {
  success: number;
  error: number;
}

const counters: Record<string, MutationCounters> = {};

export function incrementMutationCounter(operation: string, outcome: Outcome) {
  const entry = (counters[operation] = counters[operation] || {
    success: 0,
    error: 0,
  });
  entry[outcome]++;
}

export function getMutationCounters() {
  return Object.fromEntries(
    Object.entries(counters).map(([op, c]) => [op, { ...c }]),
  );
}

export function resetMutationCounters() {
  for (const k of Object.keys(counters)) delete counters[k];
}
