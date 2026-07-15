import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function files(directory) {
  if (!statSync(directory, { throwIfNoEntry: false })) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const candidates = ["extensions", "bin"].flatMap(files).filter((path) => /\.(ts|js)$/.test(path));
const offenders = candidates.filter((path) => readFileSync(path, "utf8").split("\n").length >= 100);
if (offenders.length) {
  console.error(`Files must be under 100 lines:\n${offenders.join("\n")}`);
  process.exit(1);
}
