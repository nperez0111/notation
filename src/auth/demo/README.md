# ATProto Auth Demo

Interactive demo server for testing the `better-auth-atproto` plugin with a real Bluesky account.

## Quick Start

```bash
# 1. Start the demo server (public client mode — works immediately)
bun run demo:auth
```

The server starts a **Cloudflare tunnel** (via [untun](https://github.com/unjs/untun)) and prints an HTTPS URL like:

```
➜ Tunnel: https://xyz.trycloudflare.com
Using baseURL: https://xyz.trycloudflare.com
```

Open that URL in your browser to sign in. The tunnel URL is used as `baseURL` so the ATProto PDS can reach the JWKS and client-metadata endpoints over HTTPS.

## Confidential Client Mode

By default the demo runs as a **public (loopback) client** — tokens last up to 14 days and the PDS does not fetch your client metadata.

To run as a **confidential client** (longer sessions, `private_key_jwt` auth):

```bash
# 1. Generate a keypair (writes atproto-key.json — gitignored)
bun run src/auth/demo/generate-keypair.ts

# 2. Restart the server — it auto-detects the key file
bun run demo:auth
```

You should see `Loaded ATProto keypair — running as confidential client` in the console.

### What changes in confidential mode

|                              | Public (loopback)                             | Confidential                                    |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `token_endpoint_auth_method` | `none`                                        | `private_key_jwt`                               |
| Max session lifetime         | 14 days                                       | 180 days                                        |
| `client_id` format           | `http://localhost?redirect_uri=...&scope=...` | `{baseURL}/oauth-client-metadata.json`          |
| JWKS endpoint                | Not served                                    | `GET /api/auth/.well-known/jwks.json`           |
| PDS fetches metadata?        | No                                            | Yes (must be publicly reachable for production) |

> **Note:** Confidential mode with `localhost` works for development because the ATProto spec allows loopback clients. For production, `baseURL` must be a publicly reachable HTTPS URL so the authorization server can fetch your client metadata and JWKS.

### Verifying the endpoints

```bash
# Client metadata
curl http://localhost:3456/api/auth/oauth-client-metadata.json | jq .

# JWKS (confidential mode only)
curl http://localhost:3456/api/auth/.well-known/jwks.json | jq .
```

## Files

| File                  | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `auth.ts`             | better-auth config with ATProto plugin, auto-loads keypair if present |
| `server.ts`           | Hono + Bun.serve web server with demo UI on port 3456                 |
| `generate-keypair.ts` | Generates `atproto-key.json` for confidential client mode             |
