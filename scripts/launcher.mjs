import { fileURLToPath } from "node:url";
import { browserCommand } from "./launcher-platform.mjs";
process.chdir(fileURLToPath(new URL("..", import.meta.url)));
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
const url = "http://127.0.0.1:4317/";
const openBrowser = () => {
  const command = browserCommand(process.platform, url);
  if (!command) {
    console.log("Open " + url);
    return;
  }
  const opener = spawn(command[0], command[1], { stdio: "ignore" });
  opener.on("error", () =>
    console.log("Open " + url + " in your browser (Linux: install xdg-utils)."),
  );
};
async function probe() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(800) });
    return (await response.text()).includes("<title>GanttDamn")
      ? "ours"
      : "other";
  } catch {
    return "closed";
  }
}
const state = await probe();
if (state === "ours") {
  openBrowser();
  process.exit(0);
}
if (state === "other") {
  console.error(
    "ポート4317は別のアプリで使用されています。終了してから再実行してください。",
  );
  process.exit(1);
}
if (!existsSync("node_modules/vite/bin/vite.js")) {
  console.error(
    "先にこのフォルダで npm ci --ignore-scripts --legacy-peer-deps を実行してください。",
  );
  process.exit(1);
}
console.log(
  "GanttDamn を起動しています。終了するにはこのウィンドウで Control + C を押してください。",
);
const child = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "4317",
    "--strictPort",
  ],
  { stdio: "inherit" },
);
let exited = false;
child.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
  exited = true;
});
child.on("exit", (code) => {
  exited = true;
  process.exitCode = code ?? 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
for (let i = 0; i < 80 && !exited; i++) {
  if ((await probe()) === "ours") {
    openBrowser();
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
}
