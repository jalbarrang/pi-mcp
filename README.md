# @dreki-gg/pi-mcp

Use MCP servers in [pi](https://github.com/badlogic/pi-mono) as either native tools or an on-demand gateway. The extension reads standard MCP configuration and keeps configuration, connections, tool projection, and pi integration in separate DDD layers.

## Install

```sh
pi install npm:@dreki-gg/pi-mcp
```

## Choose an exposure model

Direct servers are the default. They connect at session start and each discovered MCP tool is registered as a native pi tool, such as `github_search`. Choose direct exposure for small, frequently used tool sets.

Set `"lazy": true` for a large or occasional server. It does not start at session launch. pi instead exposes one `mcp` gateway tool, which connects the server only when asked. Choose lazy exposure to keep large catalogs out of the prompt.

```json
{
  "mcpServers": {
    "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
    "everything": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-everything"], "lazy": true }
  }
}
```

## Gateway transcript

The gateway takes a JSON string for `args`, preserving tool arguments across model providers.

```text
mcp({"action":"list"})
# everything: idle
mcp({"action":"list","server":"everything"})
# everything_echo: Echo a message
mcp({"action":"describe","server":"everything","tool":"everything_echo"})
# everything_echo: Echo a message
# Parameters:
# - message (required): string
mcp({"action":"call","server":"everything","tool":"everything_echo","args":"{\"message\":\"hi\"}"})
# hi
```

Use `describe` before the first call to a gateway tool.

## Commands

| Command | Purpose |
| --- | --- |
| `/mcp` or `/mcp status` | Show server transport, exposure, state, and tool count. |
| `/mcp connect <server>` | Connect or warm a server. For OAuth servers, starts authorization and then registers its tools. |
| `/mcp disconnect <server>` | Close a live connection. Existing direct pi tools remain registered and fail fast if called. |
| `/mcp tools <server>` | List bridged tool names. |
| `/mcp reload` | Re-read configuration and report added, changed, removed, and unchanged entries. |
| `/mcp auth reset <server>` | Delete stored OAuth credentials and disconnect the server. |

The footer reports configured servers, bridged tools, and nonzero authentication or failure counts in interactive pi sessions.

## Configuration

Configuration sources load in this order; later complete server entries replace earlier entries with the same name.

| Order | Source |
| --- | --- |
| 1 | `~/.config/mcp/mcp.json` |
| 2 | `~/.pi/agent/mcp.json` |
| 3 | `<project>/.mcp.json` |
| 4 | `<project>/.pi/mcp.json` |

Project files load only after pi trusts the project. `${VAR}` expands from the environment in commands, arguments, environment variables, URLs, and headers. Standard MCP fields are `command`, `args`, `env`, `cwd` for stdio and `type`, `url`, `headers` for HTTP or legacy SSE. Pi fields are `enabled`, `lazy`, `includeTools`, `excludeTools`, `oauth`, and `oauthPort`.

## Security

Project configuration can start processes, so pi trust-gates it. OAuth tokens, client registration, PKCE data, and discovery metadata are stored under `<pi agent dir>/mcp-auth/` with owner-only permissions. `oauth: false` disables OAuth; `oauthPort` selects a fixed localhost callback port. Static project headers also require project trust.

## Layout

- `extensions/mcp/domain/` contains pure domain rules and value projections.
- `extensions/mcp/application/` coordinates domain behavior through ports.
- `extensions/mcp/infrastructure/` adapts filesystem, MCP SDK, and pi APIs.
- `extensions/mcp/index.ts` is the composition root.

## Prior art

[pi-mcp-adapter](https://github.com/nicolo-ribaudo/pi-mcp-adapter) informed the gateway approach. It is proxy-only; pi-mcp adds direct native tool exposure so small, high-frequency MCP catalogs remain ergonomic.

## Development

```sh
bun install
npm test
npm run lint
npm run format:check
```

`npm test` enforces the 100-line limit for each TypeScript file, typechecks, and runs the Bun suite.
