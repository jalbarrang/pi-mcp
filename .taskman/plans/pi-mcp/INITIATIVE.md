# pi-mcp — custom MCP client for pi

## Goal

Build `@dreki-gg/pi-mcp`, a pi package (modeled on `../pi-plan-mode/`) that implements a custom MCP client: standard `.mcp.json` `mcpServers` config, stdio + Streamable HTTP (+ SSE fallback) transports, OAuth 2.1 for remote servers, and a **hybrid** exposure model — MCP tools registered as native pi tools by default, with per-server lazy mode behind a single `mcp` gateway tool.

## Ground rules (apply to every plan)

- **DDD**: single bounded context, ports & adapters. `domain/` is pure (no I/O, no `@modelcontextprotocol/sdk`, no pi imports); `application/` holds use cases; `infrastructure/` holds adapters (SDK transports, config loader, token store, pi bridge). Repo `CONTEXT.md` is the glossary (glossary only); trade-offs that meet the bar get ADRs in `docs/adr/`.
- **Every TypeScript file < 100 lines** (source and tests), enforced by a check script wired into the test command.
- SDK: v1 `@modelcontextprotocol/sdk` in `dependencies`; pi packages (`@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`, `typebox`) as optional peer deps like pi-plan-mode.
- Never spawn/connect in the extension factory; lifecycle lives in `session_start`/`session_shutdown`/on-demand. Project-scoped configs gated on `ctx.isProjectTrusted()`.

## Plan breakdown & ordering

1. **mcp-client-core** (no deps) — package scaffold, domain layer (glossary, ServerSpec/Catalog/BridgedTool, config merge, schema sanitization, name mangling), config discovery, connection manager, stdio transport, direct tool bridge, in-memory + stdio fixture tests, 100-line gate.
2. **mcp-remote-auth** (depends on core) — Streamable HTTP transport with SSE fallback, static header auth, OAuth 2.1 provider + token store + browser callback flow.
3. **mcp-ux-lazy** (depends on core) — lazy ExposurePolicy via the `mcp` gateway tool, `/mcp` command suite, footer widget, README + packaging polish. Can run in parallel with mcp-remote-auth.

Deliberation record: `.taskman/plans/mcp-client-core/context.md`.
