const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

export function bridgeToolName(server: string, tool: string, taken = new Set<string>()): string {
  const base = `${safe(server)}_${safe(tool)}`;
  if (!taken.has(base)) return base;
  let number = 2;
  while (taken.has(`${base}_${number}`)) number++;
  return `${base}_${number}`;
}
