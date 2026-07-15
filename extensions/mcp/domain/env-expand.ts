export interface Expanded<T> {
  value: T;
  warnings: string[];
}

function expandString(value: string, env: Record<string, string>, warnings: string[]): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, name: string) => {
    if (name in env) return env[name];
    warnings.push(`Missing environment variable: ${name}`);
    return match;
  });
}

export function expandEnv(value: string, env: Record<string, string>): Expanded<string>;
export function expandEnv(value: string[], env: Record<string, string>): Expanded<string[]>;
export function expandEnv(
  value: Record<string, string>,
  env: Record<string, string>,
): Expanded<Record<string, string>>;
export function expandEnv(
  value: string | string[] | Record<string, string>,
  env: Record<string, string>,
): Expanded<typeof value> {
  const warnings: string[] = [];
  const expand = (entry: string) => expandString(entry, env, warnings);
  const result =
    typeof value === "string"
      ? expand(value)
      : Array.isArray(value)
        ? value.map(expand)
        : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expand(entry)]));
  return { value: result as typeof value, warnings };
}
