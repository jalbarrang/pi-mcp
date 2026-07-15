# 0001: Use hybrid tool exposure

## Context

MCP servers vary from small focused tool sets to large catalogs. A proxy-only model saves context but makes ordinary tools less ergonomic, while direct-only exposure makes every catalog costly.

## Decision

Expose servers directly by default and support lazy gateway exposure per server. This follows the useful distinction in proxy-only prior art such as pi-mcp-adapter without making it the only interface.

## Status

Accepted.

## Consequences

Direct servers consume tool context for native pi ergonomics. Lazy servers avoid that cost but add gateway indirection and are handled by a follow-up plan.
