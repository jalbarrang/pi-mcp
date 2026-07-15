# pi-mcp — planning context

## Intent

Build `@dreki-gg/pi-mcp`: a custom MCP client implementation for pi, packaged like `../pi-plan-mode/` (pi package with `pi` manifest, extensions dir, bun tests, oxlint/oxfmt, release-please). Pi deliberately ships no built-in MCP — the sanctioned path is exactly this kind of extension. The user wants their own implementation, not to adopt `pi-mcp-adapter`.

## Decisions (user-confirmed via questionnaire)

- **Architecture: hybrid.** Direct registration by default — each MCP tool becomes a native pi tool via `pi.registerTool()` with per-server `includeTools`/`excludeTools` filters. Per-server `"lazy": true` opts a server into a single proxy meta-tool (`mcp` with list/describe/call) so heavy servers cost ~200 tokens and only spawn on first call.
- **SDK: v1 `@modelcontextprotocol/sdk`** (battle-tested, ~9k dependents). Not v2 `@modelcontextprotocol/client` (too young), not hand-rolled.
- **Feature scope v1: tools only.** No resources/prompts/roots/sampling/elicitation/tasks in v1 — capture as deferred follow-ups.
- **Transports: stdio + Streamable HTTP + OAuth 2.1.** SSE transport kept only as automatic fallback for legacy remote servers.
- **Config: standard `.mcp.json` `mcpServers` format** for interop with Claude Code/Cursor. Precedence: `~/.config/mcp/mcp.json` → `~/.pi/agent/mcp.json` → `.mcp.json` (project) → `.pi/mcp.json` (project override, later wins). Pi-specific keys (`lazy`, `includeTools`, `excludeTools`, `enabled`) live alongside standard keys; other hosts ignore them.

## Constraints

- **DDD (user-mandated).** Single bounded context. Ports & adapters layering: `domain/` (pure — no I/O, no SDK imports, no pi imports), `application/` (use cases orchestrating domain + ports), `infrastructure/` (SDK transports, config file loader, token store, pi adapter). Repo gets a root `CONTEXT.md` glossary (glossary only, no implementation detail) maintained per the domain-modeling skill; hard-to-reverse trade-offs get ADRs in `docs/adr/`.
- **Every file < 100 lines (user-mandated).** Applies to all TypeScript (source and tests). Forces fine-grained modules: one use case / one tool / one adapter per file; tests split per behavior. Enforced by a `bin/check-file-length.js` gate wired into `npm test`/CI so it cannot rot.

- Pi extension rules: **never start processes in the extension factory** — spawn/connect in `session_start` or on first tool call; clean up in `session_shutdown` (idempotent). `pi.registerTool()` works dynamically mid-session, no `/reload` needed.
- Project-scoped configs (`.mcp.json`, `.pi/mcp.json`) must be gated on `ctx.isProjectTrusted()` — they can spawn arbitrary processes.
- Tool results MUST be truncated (`truncateHead`, `DEFAULT_MAX_BYTES`/`DEFAULT_MAX_LINES` from pi).
- Schema gap: MCP tools carry raw JSON Schema `inputSchema`; pi tools take TypeBox schemas (which ARE JSON Schema objects at runtime). Pass-through mostly works, but Google API compatibility requires sanitization (no `anyOf` unions for enums — `StringEnum` shape, strip `$ref`/`$schema`/unsupported keywords).
- Tool errors: pi marks `isError` only when `execute` **throws**; MCP returns `isError: true` results — bridge must convert.
- Pi bundles `typebox`, `@earendil-works/pi-*` as peer deps (`"*"` range, not bundled). `@modelcontextprotocol/sdk` goes in `dependencies`.
- MCP spec current revision: **2025-11-25** (SDK handles version negotiation; older servers negotiate down).
- Names: MCP tool names may contain chars pi/model APIs dislike; prefix as `<server>_<tool>` and sanitize to `[a-zA-Z0-9_-]`.

## Domain model (ubiquitous language — seeds repo CONTEXT.md)

- **ServerSpec** — value object: one named entry from `mcpServers` config (transport kind, command/args/env or url/headers, exposure policy, filters, enabled). Immutable result of config merge.
- **Catalog** — the merged, precedence-resolved set of ServerSpecs from the four config sources.
- **Connection** — entity, identity = server name. States: `idle → connecting → ready → failed | closed`. Owns one SDK Client + transport.
- **RemoteTool** — value object: a tool as advertised by a server (raw name, description, JSON Schema inputSchema).
- **BridgedTool** — value object: projection of a RemoteTool into pi's tool space (prefixed/sanitized name, sanitized schema). Pure mapping, unit-testable.
- **ExposurePolicy** — per-server: `direct` (each BridgedTool registered as a native pi tool) or `lazy` (reachable only through the Gateway tool).
- **Gateway** — the single proxy meta-tool (`mcp`: list/describe/call) that serves lazy servers.
- **Credential** — per-server OAuth tokens + client registration, persisted by the token store port.

## SDK v1 facts (verified)

- `Client` from `@modelcontextprotocol/sdk/client/index.js`
- `StdioClientTransport` from `.../client/stdio.js` — spawns and owns the child process; `close()` ends stdin then SIGTERM/SIGKILL
- `StreamableHTTPClientTransport` from `.../client/streamableHttp.js`; `SSEClientTransport` from `.../client/sse.js` (fallback on 4xx from Streamable HTTP — documented pattern)
- OAuth: `OAuthClientProvider` interface + `auth()` from `.../client/auth.js`; caller supplies token/client-info storage and `redirectToAuthorization`
- `InMemoryTransport.createLinkedPair()` from `.../inMemory.js` — pairs with an SDK `McpServer` for fast in-process tests
- Client verbs: `listTools()`, `callTool({name, arguments})`; `notifications/tools/list_changed` handler available

## Discarded options

- **Adopt/fork `pi-mcp-adapter`** (proxy-only, most popular prior art): user explicitly wants a custom implementation; also proxy-only trades native tool ergonomics away. We take its good ideas (lazy servers, standard config discovery, metadata cache) into the hybrid design.
- **SDK v2 (`@modelcontextprotocol/client`)**: cleaner API but young; migration later is contained inside the client-manager module.
- **Hand-rolled JSON-RPC**: maximal learning, but OAuth + Streamable HTTP resumption + version negotiation is a lot of undifferentiated work; rejected with OAuth in scope.
- **Resources/prompts in v1**: deferred; prompts→slash-commands and resources→context are natural v2 features and don't affect the core architecture.
- **Single flat plan**: work spans core client, remote+OAuth, and UX/proxy — three coherent sessions with real dependency ordering → initiative with 3 plans.

## Open questions

None blocking. Deferred (captured as follow-ups, not v1): resources, prompts, roots, sampling/elicitation, MCP tasks (2025-11-25), tool-metadata disk cache for lazy servers before first connect.

## Prior art (differentiation)

- `pi-mcp-adapter` v2.11 — proxy-only, rich host-config import (`/mcp setup`), deps: sdk v1, zod, recheck, open
- `pi-mcp-extension`, `@spences10/pi-mcp`, `@pi-unipi/mcp` — assorted; none do hybrid direct+lazy
