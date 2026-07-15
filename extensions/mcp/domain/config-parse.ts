import type { RawServer, ServerSpec, SharedServerSpec } from "./config-types.js";

export type ParseResult = ServerSpec | { error: string };

const strings = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined;
const record = (value: unknown): Record<string, string> | undefined =>
  value &&
  typeof value === "object" &&
  Object.values(value).every((item) => typeof item === "string")
    ? (value as Record<string, string>)
    : undefined;

function shared(name: string, raw: RawServer): SharedServerSpec {
  return {
    name,
    enabled: raw.enabled !== false,
    lazy: raw.lazy === true,
    ...(strings(raw.includeTools) && { includeTools: strings(raw.includeTools) }),
    ...(strings(raw.excludeTools) && { excludeTools: strings(raw.excludeTools) }),
  };
}

export function parseServer(name: string, raw: RawServer): ParseResult {
  const base = shared(name, raw);
  if (typeof raw.command === "string")
    return {
      ...base,
      kind: "stdio",
      command: raw.command,
      args: strings(raw.args) ?? [],
      env: record(raw.env) ?? {},
      ...(typeof raw.cwd === "string" && { cwd: raw.cwd }),
    };
  if (typeof raw.url === "string") {
    const kind = raw.type === "sse" ? "sse" : "http";
    return {
      ...base,
      kind,
      url: raw.url,
      headers: record(raw.headers) ?? {},
      ...(typeof raw.oauth === "boolean" && { oauth: raw.oauth }),
      ...(typeof raw.oauthPort === "number" && { oauthPort: raw.oauthPort }),
    };
  }
  return { error: `Server ${name} requires command or url` };
}
