# @dreki-gg/pi-mcp

Use MCP servers as native tools in [pi](https://github.com/badlogic/pi-mono). The core extension reads compatible MCP configuration, starts trusted direct stdio servers when a pi session starts, and projects their tools into pi.

## Install

```sh
pi install npm:@dreki-gg/pi-mcp
```

## Configure servers

Create `.mcp.json` in a trusted project:

```json
{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

Configuration sources are loaded in this order; later entries replace an earlier entry with the same server name.

| Order | Source |
| --- | --- |
| 1 | `~/.config/mcp/mcp.json` |
| 2 | `~/.pi/agent/mcp.json` |
| 3 | `<project>/.mcp.json` |
| 4 | `<project>/.pi/mcp.json` |

Project sources are read only when pi trusts the project. Set `PI_CODING_AGENT_DIR` to use a different agent directory. `${VAR}` expands from the environment in commands, arguments, environment variables, URLs, and headers; unresolved variables remain literal and produce a notice.

Standard MCP entries support stdio (`command`, optional `args`, `env`, and `cwd`) and remote (`type: "http" | "sse"`, `url`, optional `headers`) shapes. Pi-specific keys are `enabled` (defaults to `true`), `lazy` (defaults to `false`), `includeTools`, and `excludeTools`.

## Current scope

This release connects enabled, direct stdio servers and registers tools as `<server>_<tool>`. Remote transports with OAuth and lazy servers with a gateway are deferred to follow-up packages. pi cannot unregister a tool during a session: if an MCP server later withdraws one, its existing pi registration remains and reports the server error when invoked.

## Layout

- `extensions/mcp/domain/` — pure config and tool-bridging rules.
- `extensions/mcp/application/` — connection, synchronization, and call use cases behind ports.
- `extensions/mcp/infrastructure/` — filesystem, MCP SDK, and pi adapters.
- `extensions/mcp/index.ts` — session lifecycle composition root.

## Development

```sh
bun install
npm test
npm run lint
npm run format:check
```

`npm test` enforces the 100-line limit for every TypeScript source and test file, typechecks, and runs the Bun suite.
