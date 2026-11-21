import { fileURLToPath } from "node:url";
import { writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
if (/[\r\n]/.test(root))
  throw new Error("The project path must not contain line breaks.");
const quote = (s) =>
  '"' + s.replace(/%/g, "%%").replace(/[\\"`$]/g, "\\$&") + '"';
const target = join(root, "GanttDamn.desktop");
writeFileSync(
  target,
  `[Desktop Entry]\nVersion=1.0\nType=Application\nName=GanttDamn\nComment=Local timeline editor\nExec=/usr/bin/env bash ${quote(join(root, "scripts/launch.sh"))}\nIcon=${join(root, "assets/gantt-damn.svg")}\nTerminal=true\nCategories=Office;ProjectManagement;\n`,
);
chmodSync(target, 0o755);
console.log(target);
