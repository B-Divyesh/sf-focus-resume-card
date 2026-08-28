import { mkdir, readFile, writeFile } from 'node:fs/promises';

const apiBase = (process.env.API_BASE ?? 'https://api.sociobot.in/api/v1').replace(/\/$/u, '');
const contract = JSON.parse(await readFile('.factory/gateway-rate-limit-contract.json', 'utf8'));
const evidence = {
  observedAt: new Date().toISOString(),
  apiBase,
  product: contract.product,
  routes: [],
};

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function validRetryAfter(value, windowSeconds) {
  return /^\d+$/u.test(value ?? '') && Number.parseInt(value, 10) >= 1 && Number.parseInt(value, 10) <= windowSeconds;
}

async function probe(route) {
  const observations = [];
  for (let index = 1; index <= route.allowance + 1; index += 1) {
    const token = `rate-contract-probe-${Date.now()}-${index}`;
    const url = route.id === 'license-verify'
      ? `${apiBase}${route.path}?license=${encodeURIComponent(token)}`
      : `${apiBase}${route.path}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: route.id === 'license-verify' ? 'application/json' : 'text/html' },
      redirect: 'manual',
    });
    observations.push({
      request: index,
      status: response.status,
      retryAfter: response.headers.get('retry-after'),
      cacheControl: response.headers.get('cache-control'),
      location: response.headers.get('location'),
    });
  }
  evidence.routes.push({ id: route.id, allowance: route.allowance, observations });

  const allowed = observations.slice(0, route.allowance);
  const blocked = observations.at(-1);
  requireCondition(allowed.every((result) => result.status === route.normalStatus), `${route.id}: expected ${route.allowance} initial ${route.normalStatus} responses, observed ${allowed.map((result) => result.status).join(', ')}`);
  requireCondition(blocked?.status === contract.response.status, `${route.id}: request ${route.allowance + 1} must return ${contract.response.status}, received ${blocked?.status}`);
  requireCondition(validRetryAfter(blocked.retryAfter, contract.windowSeconds), `${route.id}: 429 must include Retry-After from 1 to ${contract.windowSeconds} seconds, received ${blocked.retryAfter ?? 'none'}`);
  requireCondition((blocked.cacheControl ?? '').includes(contract.response.cacheControl), `${route.id}: 429 must include Cache-Control: ${contract.response.cacheControl}`);
  if (route.id === 'checkout') requireCondition(!blocked.location, 'checkout: limited request must not redirect to a checkout session');
}

try {
  const failures = [];
  for (const route of contract.routes) {
    try {
      await probe(route);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`gateway rate limit: ${contract.routes.map((route) => `${route.id} ${route.allowance}/${contract.windowSeconds}s`).join(', ')} enforced with real 429 Retry-After responses`);
} finally {
  await mkdir('.factory/evidence', { recursive: true });
  await writeFile('.factory/evidence/gateway-rate-limit.json', `${JSON.stringify(evidence, null, 2)}\n`);
}
