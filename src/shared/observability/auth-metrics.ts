const counters: Record<string, number> = {
  auth_success: 0,
  auth_fail: 0,
};

export function incAuthSuccess() {
  counters.auth_success += 1;
}

export function incAuthFail(reason: string) {
  const key = `auth_fail_${reason.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`;
  counters.auth_fail += 1;
  counters[key] = (counters[key] || 0) + 1;
}

export function getAuthCounters() {
  return { ...counters };
}
