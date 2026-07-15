# mcp-ux-lazy — Handoff

## Goal

Complete the hybrid exposure model of `@dreki-gg/pi-mcp` and its user-facing surface: (1) the **Gateway** — one `mcp` meta-tool serving all servers marked `"lazy": true`, connecting them on first use; (2) the **`/mcp` command suite** for status, connect/disconnect, tool listing, and auth reset; (3) footer widget + packaging polish for npm release. Runs after mcp-client-core; independent of mcp-remote-auth (if remote-auth landed, lazy remote servers and `/mcp auth` work too — degrade gracefully if not).

## Prerequisites & rules

Read repo `CONTEXT.md`, `docs/adr/0001-hybrid-exposure-model.md`, and `.taskman/plans/mcp-client-core/context.md`. Hard rules carry over: **DDD layer purity** and **every TS file <100 lines** (gate already in `npm test`). UI work follows pi extension docs (`ctx.ui`, `registerCommand` with `getArgumentCompletions`, `setWidget`).

## Design

### Gateway (lazy exposure)

- ServerSpecs with `lazy: true` are NOT connected at session_start and none of their tools are registered directly.
- One pi tool `mcp` registered whenever ≥1 lazy server exists. Parameters (TypeBox, use `StringEnum`): `{action: "list" | "describe" | "call", server?: string, tool?: string, args?: string}` — `args` is a JSON string (survives every provider's serialization; document in the description like pi-mcp-adapter does).
  - `list`: no server → list lazy servers + connection state; with server → connect if needed, list its tools (name + one-line description).
  - `describe`: connect if needed, return tool description + readable parameter summary rendered from the sanitized schema.
  - `call`: connect if needed, parse `args` JSON (clear error on malformed), invoke via existing call-tool use case (inherits truncation, isError→throw, abort wiring).
- `promptSnippet`: one line ("Discover and call tools on lazy MCP servers: list → describe → call"). `promptGuidelines`: name the tool explicitly per pi docs ("Use mcp with action \"describe\" before the first call to a tool…").
- Application layer: `gateway.ts` use case reusing ConnectionManager (ensureConnected(name)) + sync-tools' bridging (but registering nothing — bridged metadata only, kept in an in-memory ToolCatalog per connection).
- Domain: `describe-render.ts` — pure renderer: sanitized JSON Schema → readable parameter block (name, type, enum values, default, required marker).

### /mcp command suite

`pi.registerCommand("mcp", …)` with subcommand arg + `getArgumentCompletions` for subcommands and server names:
- `/mcp` or `/mcp status` — per-server line: name, transport kind, exposure (direct/lazy), state (ready/needs-auth/failed/idle), tool count, failure reason. Render via `ctx.ui.notify` for one-liner or a custom entry for the table (keep simple: multi-line notify is fine for v1).
- `/mcp connect <server>` / `/mcp disconnect <server>` — manual lifecycle; connect on a lazy server warms it; disconnect closes and (for direct servers) leaves tools registered but failing fast with a clear message (pi has no unregister — documented limitation from core plan).
- `/mcp tools <server>` — list bridged tool names + skipped tools with reasons.
- `/mcp reload` — re-read config sources, diff catalog, connect new/changed servers (changed = whole-entry compare), report.
- `/mcp auth reset <server>` — call CredentialStorePort.clear + disconnect (no-op with notice if mcp-remote-auth not merged; guard by checking whether the credential-store module exists in the wiring).

### Widget & polish

- `ctx.ui.setWidget("mcp", lines)` one line: `MCP: 3 servers · 24 tools · 1 needs auth` — update on state changes; clear when no servers configured.
- Packaging: `files` allowlist correct, README full rewrite (hybrid model explanation, gateway usage transcript, command reference, config reference incl. `lazy`), CHANGELOG, optional release-please config copied from pi-plan-mode. Prose not hard-wrapped.

## Verification (whole plan)

`npm test` green. Manual: config with one direct + one `"lazy": true` server → session start registers only direct tools + `mcp` gateway; `mcp({action:"list"})` connects lazy server on demand; `/mcp status` reflects it; widget updates.
