# mcp-client-core — Handoff

## Goal

Stand up `@dreki-gg/pi-mcp` as a pi package and ship the core vertical slice: read standard `.mcp.json` configs → connect to stdio MCP servers via `@modelcontextprotocol/sdk` (v1) → register each MCP tool as a native pi tool → calls round-trip with truncation and error mapping. Remote transports/OAuth (mcp-remote-auth) and lazy/gateway + `/mcp` UX (mcp-ux-lazy) build on this.

## Hard rules

1. **DDD ports & adapters.** Layers under `extensions/mcp/`:
   - `domain/` — pure functions & types. MUST NOT import `@modelcontextprotocol/sdk`, `node:fs`, `node:child_process`, or any `@earendil-works/*` package. Pure = unit-testable without mocks.
   - `application/` — use cases that orchestrate domain + ports (interfaces). Depends on domain only; ports are TS interfaces defined here or in domain.
   - `infrastructure/` — adapters implementing ports: SDK client/transport wrapper, config file loader, pi tool-registration bridge.
   - `index.ts` — thin composition root: wires adapters, subscribes pi events.
2. **Every TypeScript file < 100 lines** (source AND tests). Split aggressively: one type-cluster, one use case, one adapter, one test-behavior per file. Enforced by `bin/check-file-length.js` (task t-002) which is part of `npm test`.
3. **Never start processes in the extension factory.** Connect in `session_start`; disconnect idempotently in `session_shutdown`.
4. Project configs (`.mcp.json`, `.pi/mcp.json`) are only honored when `ctx.isProjectTrusted()` is true.

## Reference material

- Deliberation + verified SDK facts: `.taskman/plans/mcp-client-core/context.md`
- Package layout to copy: `../pi-plan-mode/` (package.json `pi` manifest, tsconfig, oxlint/oxfmt, bun test, peerDependencies pattern)
- Pi extension API: `/Users/jalbarran/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` (registerTool, session events, truncation utils, StringEnum caveat)
- Dynamic tool example: `.../examples/extensions/dynamic-tools.ts`

## Domain model (write into repo CONTEXT.md, glossary-only)

ServerSpec (VO: named config entry — transport kind, command/args/env/cwd or url/headers, exposure policy, tool filters, enabled) · Catalog (merged precedence-resolved ServerSpecs) · Connection (entity keyed by server name; `idle→connecting→ready→failed|closed`) · RemoteTool (VO: server-advertised tool, raw JSON Schema) · BridgedTool (VO: RemoteTool projected into pi tool space — prefixed sanitized name, sanitized schema) · ExposurePolicy (`direct` | `lazy`) · Gateway (proxy meta-tool, built in mcp-ux-lazy) · Credential (OAuth tokens, built in mcp-remote-auth).

## Config contract

Sources, later wins per-server-name: `~/.config/mcp/mcp.json` → `~/.pi/agent/mcp.json` → `<cwd>/.mcp.json` → `<cwd>/.pi/mcp.json`. Schema per entry (standard keys interop with Claude Code/Cursor): stdio `{command, args?, env?, cwd?}`; remote `{type: "http"|"sse", url, headers?}` (remote entries are parsed into ServerSpecs here but connecting them is mcp-remote-auth's job — core must skip them with a notice, not crash). Pi-specific keys other hosts ignore: `enabled?: boolean` (default true), `lazy?: boolean` (default false; lazy servers are skipped in core, wired in mcp-ux-lazy), `includeTools?: string[]`, `excludeTools?: string[]`. `${VAR}` env expansion in `command`, `args`, `env`, `url`, `headers` values.

## Bridging rules (domain/)

- Pi tool name: `<server>_<tool>`, sanitized to `[a-zA-Z0-9_-]`, collisions resolved deterministically (suffix `_2`).
- Schema: MCP `inputSchema` is raw JSON Schema; TypeBox schemas are JSON Schema objects at runtime, so sanitize-and-cast: strip `$schema`/`$ref`+definitions (inline or reject), convert `enum`/single-type unions to the `StringEnum` shape (Google API rejects `anyOf` enums), default missing `type: "object"`, drop unsupported keywords. Unbridgeable tool → skip with a recorded reason, never throw at registration.
- Results: MCP content blocks → pi content (`text` passthrough; `image` → pi image block; other types → JSON-stringified text). Apply `truncateHead` with `DEFAULT_MAX_BYTES`/`DEFAULT_MAX_LINES` from `@earendil-works/pi-coding-agent`. MCP `isError: true` → **throw** in pi execute (pi only flags errors on throw). Wire pi's `signal` to the SDK call; on abort return promptly.

## Verification (whole plan)

`cd /Users/jalbarran/fun/drekki/pi-mcp && npm test` green (includes file-length gate + typecheck + bun tests). Manual smoke: `pi -e ./extensions/mcp` in a dir whose `.mcp.json` has a stdio server (e.g. `npx -y @modelcontextprotocol/server-everything`), confirm tools appear and a call round-trips.
