import type { Catalog } from "./ports.js";

export interface ReloadDiff {
  added: string[];
  changed: string[];
  removed: string[];
  unchanged: string[];
}

export function diffCatalogs(previous: Catalog, next: Catalog): ReloadDiff {
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  for (const [name, spec] of next) {
    const old = previous.get(name);
    if (!old) added.push(name);
    else if (JSON.stringify(old) === JSON.stringify(spec)) unchanged.push(name);
    else changed.push(name);
  }
  return { added, changed, unchanged, removed: [...previous.keys()].filter((name) => !next.has(name)) };
}
