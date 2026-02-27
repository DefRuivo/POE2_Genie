const LEGACY_SUNSET = process.env.LEGACY_API_SUNSET || 'Wed, 30 Sep 2026 23:59:59 GMT';
const LEGACY_MIGRATION_LINK = process.env.LEGACY_API_MIGRATION_LINK || '/MIGRATION.md';

const dailyCounters = new Map<string, number>();

function nextDailyCount(route: string, method: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${method.toUpperCase()}:${route}`;
  const current = dailyCounters.get(key) || 0;
  const next = current + 1;
  dailyCounters.set(key, next);
  return next;
}

export function withLegacyDeprecationHeaders(
  response: Response,
  route: string,
  method: string,
): Response {
  if (!response || typeof (response as any).headers?.set !== 'function') {
    return response as Response;
  }

  const dailyCount = nextDailyCount(route, method);

  console.info('[Legacy API]', {
    route,
    method: method.toUpperCase(),
    dailyCount,
  });

  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', LEGACY_SUNSET);
  response.headers.set('Link', `<${LEGACY_MIGRATION_LINK}>; rel="deprecation"; type="text/markdown"`);
  response.headers.set('X-Legacy-Endpoint', route);
  response.headers.set('X-Legacy-Usage-Day-Count', String(dailyCount));

  return response;
}
