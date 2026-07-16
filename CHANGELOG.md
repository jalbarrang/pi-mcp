# Changelog

## [0.2.0](https://github.com/jalbarrang/pi-mcp/compare/v0.1.0...v0.2.0) (2026-07-16)


### Features

* add gateway domain catalog ([21a75a8](https://github.com/jalbarrang/pi-mcp/commit/21a75a83c231834b6f6cdab91ef416c2976297bd))
* add lazy MCP gateway use case ([3ae8a34](https://github.com/jalbarrang/pi-mcp/commit/3ae8a3473ccdfa9446a87edf6bd337480a6f247f))
* add mcp application services ([634d5f1](https://github.com/jalbarrang/pi-mcp/commit/634d5f162ffb02e4a7cd50c28e70108842e12da5))
* add MCP management commands ([2dcdb48](https://github.com/jalbarrang/pi-mcp/commit/2dcdb4855ca61199ececd4fd4d92f0cf1acf69d4))
* add MCP OAuth authorization flow ([7202f1e](https://github.com/jalbarrang/pi-mcp/commit/7202f1e29de7d98d4d78826e0997bd640da143f0))
* add OAuth credential and callback adapters ([64948fd](https://github.com/jalbarrang/pi-mcp/commit/64948fd2c408fd260cf73b430b8740d294029148))
* add pure mcp config domain ([00324db](https://github.com/jalbarrang/pi-mcp/commit/00324db3fa0724487e26cc8d5966ac6c0ac1d4e8))
* add remote auth domain ports ([36b2750](https://github.com/jalbarrang/pi-mcp/commit/36b27509fec0035df963b7000f83c94cadd5b663))
* bridge mcp tools in domain ([5758036](https://github.com/jalbarrang/pi-mcp/commit/57580360e9888da926f69198307d586068d9ff5a))
* connect remote MCP servers over HTTP ([bf659af](https://github.com/jalbarrang/pi-mcp/commit/bf659af08452e8b54cd4ae001d9bf94edf9d357f))
* load mcp config and connect stdio ([b030c4c](https://github.com/jalbarrang/pi-mcp/commit/b030c4ced928efd9783e9044466afa0984d15ff3))
* register lazy MCP gateway tool ([982c9b5](https://github.com/jalbarrang/pi-mcp/commit/982c9b5432f9a649d12bc8ee565d5638858206fc))
* show MCP footer widget ([7421845](https://github.com/jalbarrang/pi-mcp/commit/7421845f4c75bb9bda912a23099fcff223236c92))
* wire pi MCP extension lifecycle ([7b1bf46](https://github.com/jalbarrang/pi-mcp/commit/7b1bf46a3bba53bfde6f84569b2bf7d04942c21c))
* wire remote OAuth into MCP sessions ([25bb051](https://github.com/jalbarrang/pi-mcp/commit/25bb051b7e63855e7906b98aa82b1dee639715a4))


### Bug Fixes

* bound MCP output and cleanup shutdowns ([1ea1fd9](https://github.com/jalbarrang/pi-mcp/commit/1ea1fd91f51e175e25b6bac98b1c6abcba155258))
* sanitize nested MCP schemas and preserve tool names ([0f7abf4](https://github.com/jalbarrang/pi-mcp/commit/0f7abf473c3a31e403d35590e257d103c81a766f))

## Changelog

## Unreleased

- Add the hybrid direct/lazy exposure model, on-demand `mcp` gateway, `/mcp` lifecycle commands, and interactive MCP footer widget.

- Add Streamable HTTP MCP connections with legacy SSE fallback and OAuth 2.1 browser authorization backed by private persisted credentials.
- Fix nested MCP schema sanitization, stable tool resyncs, output caps, and shutdown cleanup.
- Initial core MCP client for pi: trusted configuration loading, direct stdio connections, and native tool bridging.
