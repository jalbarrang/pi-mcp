# Domain glossary

- **ServerSpec**: An immutable named MCP server configuration describing its transport, settings, and exposure choices.
- **Catalog**: The precedence-resolved collection of ServerSpecs.
- **Connection**: An entity, identified by server name, that represents the lifecycle of one server relationship.
- **RemoteTool**: A server-advertised tool with its original name, description, and input schema.
- **BridgedTool**: A RemoteTool projected into pi's tool namespace with a safe name and schema.
- **ExposurePolicy**: Whether a server is exposed directly or through a lazy gateway.
- **Gateway**: A proxy meta-tool that serves lazy servers.
- **Credential**: Stored authorization material for a server.

Connection states: `idle → connecting → ready → failed | closed`.
