import { createServer, type Server } from 'node:http';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const productPath = '/products/focus-resume-card';
let server: Server | undefined;

type GatewayMode = 'compliant' | 'unlimited' | 'zero-retry' | 'cacheable' | 'redirecting-limit';

function limitHeaders(mode: GatewayMode, checkout = false): Record<string, string> {
  if (mode === 'zero-retry') return { 'Cache-Control': 'no-store', 'Retry-After': '0' };
  if (mode === 'cacheable') return { 'Cache-Control': 'private', 'Retry-After': '23' };
  return {
    'Cache-Control': 'no-store',
    'Retry-After': '23',
    ...(mode === 'redirecting-limit' && checkout ? { Location: 'https://checkout.dodopayments.com/session/limited' } : {}),
  };
}

async function startGateway(mode: GatewayMode): Promise<string> {
  let verifyRequests = 0;
  let checkoutRequests = 0;
  server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://gateway.test').pathname;
    if (path === `${productPath}/verify`) {
      verifyRequests += 1;
      if (mode !== 'unlimited' && verifyRequests === 14) {
        response.writeHead(429, limitHeaders(mode));
      } else {
        response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });
      }
      response.end('{"valid":false,"reason":"invalid"}');
      return;
    }
    if (path === `${productPath}/checkout`) {
      checkoutRequests += 1;
      if (mode !== 'unlimited' && checkoutRequests === 8) {
        response.writeHead(429, limitHeaders(mode, true));
      } else {
        response.writeHead(303, { Location: 'https://checkout.dodopayments.com/session/test' });
      }
      response.end();
      return;
    }
    response.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test gateway did not bind a TCP port.');
  return `http://127.0.0.1:${address.port}`;
}

async function runProbe(apiBase: string) {
  return run(process.execPath, ['scripts/gateway-rate-limit-check.mjs'], {
    env: { ...process.env, API_BASE: apiBase },
  });
}

async function getProbeFailure(mode: Exclude<GatewayMode, 'compliant'>) {
  const apiBase = await startGateway(mode);
  return runProbe(apiBase).then(
    () => { throw new Error(`The probe accepted the ${mode} gateway.`); },
    (error: { stderr?: string }) => error,
  );
}

afterEach(async () => {
  if (!server) return;
  server.close();
  await once(server, 'close');
  server = undefined;
});

describe('gateway response-policy probe', () => {
  it('@regression:gateway-rate-limit accepts the exact documented 13/7 allowance and compliant 429 response', async () => {
    const apiBase = await startGateway('compliant');
    const { stdout } = await runProbe(apiBase);
    expect(stdout).toContain('license-verify 13/60s, checkout 7/60s enforced');
  });

  it('@regression:gateway-rate-limit rejects an unlimited gateway that creates an eighth checkout session', async () => {
    const failure = await getProbeFailure('unlimited');
    expect(failure.stderr).toContain('license-verify: request 14 must return 429, received 200');
    expect(failure.stderr).toContain('checkout: request 8 must return 429, received 303');
  });

  it('@regression:gateway-rate-limit rejects a zero Retry-After response', async () => {
    const failure = await getProbeFailure('zero-retry');
    expect(failure.stderr).toContain('license-verify: 429 must include Retry-After from 1 to 60, received 0');
    expect(failure.stderr).toContain('checkout: 429 must include Retry-After from 1 to 60, received 0');
  });

  it('@regression:gateway-rate-limit rejects a cacheable 429 response', async () => {
    const failure = await getProbeFailure('cacheable');
    expect(failure.stderr).toContain('license-verify: 429 must include Cache-Control: no-store');
    expect(failure.stderr).toContain('checkout: 429 must include Cache-Control: no-store');
  });

  it('@regression:gateway-rate-limit rejects a limited checkout that still redirects', async () => {
    const failure = await getProbeFailure('redirecting-limit');
    expect(failure.stderr).toContain('checkout: limited request created a checkout redirect');
  });
});
