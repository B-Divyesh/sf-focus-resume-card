# Focus Resume Card billing gateway rate-limit contract

This is the required server-side contract for the public Sociobot billing
gateway. The static site and extension do not and cannot impersonate a gateway
response. The authoritative machine-readable form is
`.factory/gateway-rate-limit-contract.json`.

## Scope and allowance

The trusted API edge keys the allowance by **client IP and product slug**. The
window is 60 seconds.

| Route | Allowance | Normal response | Beyond the allowance |
| --- | ---: | --- | --- |
| `GET /api/v1/products/focus-resume-card/verify` | 12 requests / 60 s | `200` JSON license verdict | `429` |
| `GET /api/v1/products/focus-resume-card/checkout` | 6 requests / 60 s | `303` to Dodo checkout | `429`, with no checkout session created |

For either route, the first request beyond its allowance must return `429 Too
Many Requests`, `Cache-Control: no-store`, and a `Retry-After` header with a
positive integer number of seconds until the client can try again. It must not
fall through to a `503` response. The gateway remains the only component that
emits this response; client code only displays the real response and waits.

## Production proof

Run this only against the real published gateway after a quiet 60-second
window:

```bash
npm run test:gateway
```

The probe sends 13 direct verification requests with a synthetic invalid token
and 7 direct checkout requests with redirects disabled. It requires the
configured normal responses through each allowance and a real `429` plus valid
`Retry-After` on the next request. It writes the observed statuses and headers
to ignored local evidence. It never starts a local gateway, substitutes a
response, or uses a mock.

The current repository can deploy the static client but cannot configure the
shared `api.sociobot.in` edge. Until the real probe passes, this document is a
pending gateway configuration requirement, not a public claim that the
production API already enforces it.
