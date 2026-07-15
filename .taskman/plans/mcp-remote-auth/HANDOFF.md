# mcp-remote-auth — Handoff

## Goal

Extend `@dreki-gg/pi-mcp` (built by plan mcp-client-core) so remote MCP servers work: Streamable HTTP transport with automatic legacy-SSE fallback, static header auth from config, and the full OAuth 2.1 browser flow with persisted tokens. After this plan, a `{"type": "http", "url": "https://mcp.linear.app/mcp"}` entry connects, prompts the browser auth once, and its tools register like any stdio server's.

## Prerequisites

mcp-client-core is done: DDD layout under `extensions/mcp/{domain,application,infrastructure}`, `McpConnectionPort`, ConnectionManager, pi-registry adapter, `npm test` gate (typecheck + bun tests + <100-line file check). Read repo `CONTEXT.md` and `.taskman/plans/mcp-client-core/context.md` first. **Hard rules carry over: DDD layer purity (domain: no SDK/no I/O/no pi imports) and every TS file <100 lines.**

## Standards being implemented

- MCP spec 2025-11-25: Streamable HTTP is the remote transport; SSE is legacy. Recommended client behavior: attempt Streamable HTTP, on 4xx during initialize fall back to SSE transport.
- OAuth 2.1 with PKCE; authorization-server discovery via OAuth protected-resource metadata / OpenID Connect Discovery; dynamic client registration when supported. **The SDK v1 implements all of this** — the client supplies an `OAuthClientProvider` (from `@modelcontextprotocol/sdk/client/auth.js`) with: `redirectUrl`, `clientMetadata`, token/client-info/PKCE-verifier storage callbacks, and `redirectToAuthorization(url)`. Transports accept `authProvider` and drive the flow, throwing `UnauthorizedError` when interactive auth is needed; after the callback delivers the code, call `transport.finishAuth(code)` and reconnect.

## Design

- `domain/`: nothing OAuth-specific beyond the existing `Credential` term; add `needs-auth` state to Connection (`ready | needs-auth | failed`) so UX layers can render it.
- `application/`: `authorize-server.ts` use case — orchestrates: connect attempt → on UnauthorizedError → open browser → await callback code (with timeout + abort) → finishAuth → reconnect → sync tools. Ports: `BrowserPort {open(url)}`, `CallbackServerPort {waitForCode(state, signal): Promise<string>}`, `CredentialStorePort {load/save/clear(serverName)}`.
- `infrastructure/`:
  - `http-connection.ts` — StreamableHTTPClientTransport (`.../client/streamableHttp.js`) with `requestInit.headers` from ServerSpec, `authProvider` attached; fallback to `SSEClientTransport` (`.../client/sse.js`) on 4xx initialize failure; also honor explicit `"type": "sse"` specs directly.
  - `oauth-provider.ts` — implements the SDK `OAuthClientProvider` against `CredentialStorePort`.
  - `credential-store.ts` — JSON files under `<pi agent dir>/mcp-auth/<server>.json` (dir from `$PI_CODING_AGENT_DIR` else `~/.pi/agent`), written with mode 0600, dir 0700.
  - `callback-server.ts` — ephemeral `node:http` server on `127.0.0.1` (port from config `oauthPort` else ephemeral), single-use, validates `state`, responds with a tiny "you can close this tab" page, closes itself.
  - Browser open: via `pi.exec` platform command (`open`/`xdg-open`/`start`) — no extra npm dep; on failure surface the URL through `ctx.ui.notify` for manual opening.
- Config additions (pi-specific, ignored by other hosts): `oauth?: boolean` (default: auto — try plain first, OAuth on 401), `oauthPort?: number`.
- ConnectionManager: remote specs are no longer "deferred" — route to http-connection. `needs-auth` connections do NOT block startup; they surface in the summary notify and are authorized on demand: first tool call triggers the authorize-server use case (single-flight).

## Security constraints

- Tokens never logged, never in tool results, never in session entries. Credential files 0600.
- Callback server binds 127.0.0.1 only, one-shot, hard 5-minute timeout, `state` param validated.
- Static `headers` from project-scoped config only apply when project is trusted (inherited rule).

## Verification (whole plan)

`npm test` green (unit tests use fake ports + an in-process Streamable HTTP server fixture over `node:http`). Manual gate: config with a real OAuth remote server (e.g. `{"notion": {"type": "http", "url": "https://mcp.notion.com/mcp"}}` or Linear) — first use opens browser, after consent tools register; second session reuses stored tokens with no browser.
