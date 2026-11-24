import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = path => readFileSync(resolve(root, path), "utf8");
const sha = text => createHash("sha256").update(text).digest("hex");
const manifest = JSON.parse(read("package.json"));
const lockText = read("package-lock.json");
const packages = Object.entries(JSON.parse(lockText).packages).filter(([path]) => path);
const permitted = new Set([
  "MIT", "ISC", "BSD-3-Clause", "Apache-2.0", "BlueOak-1.0.0", "MPL-2.0",
  "CC-BY-4.0", "Unlicense", "MIT/X11", "(MIT OR GPL-3.0-or-later)", "(MIT AND Zlib)",
]);
const verifiedBuffersFiles = {
  "README.markdown": "99e8a68c4949c4cbe64b480c8717fb616d1d78ea7715c0e394a5186e6c3a5ace",
  "examples/slice.js": "8bff15364cb53bc2c6523dbec1dea1017696eb8b59fdf4c8d7cd31eea3a3750b",
  "examples/splice.js": "edf9fc9a0cfab7ed73edfff9a1409e65918b8f2cd34eeef04b3c6a1838ffc1cb",
  "index.js": "97801e296ba5f3c32242f647e1daac5917e300367fed7935ab1e62f40adb1b8a",
  "test/buffers.js": "9d0d9671bde206620d50e08f9f855fe7898efd74727d4b6f0913650ea252997f"
};
function identifiedLicense(path, meta) {
  if (meta.license) return meta.license;
  if (path.endsWith("/buffers") && meta.version === "0.1.1") {
    for (const [file, expected] of Object.entries(verifiedBuffersFiles)) {
      if (sha(read(`${path}/${file}`)) !== expected) throw new Error(`Recheck buffers source: ${file}`);
    }
    if (sha(read("licenses/supplemental/buffers-0.1.1-COPYRIGHT.txt")) !== "97423a03bc4476a98de2bf3fa7efff55b3f338da76a7b3cbf747b4dc6f52a056") throw new Error("Recheck buffers license evidence");
    return "MIT";
  }
  throw new Error(`Missing license evidence: ${path}@${meta.version}`);
}
const groups = new Map();
for (const [path, meta] of packages) {
  const name = path.split("node_modules/").at(-1);
  const license = identifiedLicense(path, meta);
  if (!permitted.has(license)) throw new Error(`Review license: ${name}@${meta.version}: ${license}`);
  const key = `${name}@${meta.version}`;
  if (!groups.has(key)) groups.set(key, { name, version: meta.version, license, declared: meta.license ?? "Not declared; verified from matching Debian source", paths: [], dev: true, source: meta.resolved });
  const group = groups.get(key);
  if (group.license !== license) throw new Error(`Conflicting licenses: ${key}`);
  group.paths.push(path);
  group.dev &&= !!meta.dev;
}

function licenseFiles(path) {
  const directory = resolve(root, path);
  return readdirSync(directory, { withFileTypes: true })
    .filter(file => file.isFile() && /licen[cs]e|notice|copying/i.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map(file => ({ source: `${path}/${file.name}`, text: read(`${path}/${file.name}`) }));
}

function materials(group) {
  // fsevents is macOS-only; retain its reviewed notice on Linux builders too.
  if (group.name === "fsevents" && ["2.3.2", "2.3.3"].includes(group.version)) {
    if (group.paths.length !== 1 || group.license !== "MIT")
      throw new Error("Recheck fsevents notice metadata");
    const path = group.paths[0];
    const text = read(`licenses/supplemental/fsevents-${group.version}-LICENSE.txt`);
    if (sha(text) !== "2a8a5d6197bb97a018b8a190dd3ed853d750ca87c8e80c17aad41d6c6ff448e1")
      throw new Error("The verified fsevents notice changed");
    if (existsSync(join(root, path, "package.json"))) {
      const meta = JSON.parse(read(`${path}/package.json`));
      if (meta.version !== group.version || meta.license !== group.license || read(`${path}/LICENSE`) !== text)
        throw new Error(`Installed fsevents notice mismatch: ${path}`);
    }
    return [{ source: `${path}/LICENSE`, text }];
  }
  let parent;
  if (group.name.startsWith("@esbuild/")) parent = "esbuild";
  if (group.name.startsWith("@rollup/rollup-")) parent = "rollup";
  if (group.name.startsWith("@tailwindcss/oxide-")) parent = "@tailwindcss/oxide";
  if (group.name.startsWith("lightningcss-")) parent = "lightningcss";
  if (parent) {
    const metadata = JSON.parse(read(`node_modules/${parent}/package.json`));
    if (metadata.version !== group.version || metadata.license !== group.license)
      throw new Error(`Native license parent mismatch: ${group.name}`);
    return licenseFiles(`node_modules/${parent}`);
  }
  const path = [...group.paths].sort((a, b) => a.length - b.length || a.localeCompare(b, "en"))
    .find(path => existsSync(join(root, path, "package.json")));
  if (!path) throw new Error(`Install dependencies to collect notices: ${group.name}`);
  const meta = JSON.parse(read(`${path}/package.json`));
  if (meta.version !== group.version || identifiedLicense(path, meta) !== group.license) throw new Error(`Installed metadata mismatch: ${path}`);
  if (group.name === "buffers" && group.version === "0.1.1")
    return [{ source: "licenses/supplemental/buffers-0.1.1-COPYRIGHT.txt", text: read("licenses/supplemental/buffers-0.1.1-COPYRIGHT.txt") }];
  if (group.name === "chainsaw" && group.version === "0.1.0")
    return [{ source: "licenses/supplemental/node-chainsaw-COPYRIGHT.txt", text: read("licenses/supplemental/node-chainsaw-COPYRIGHT.txt") }];
  if (group.name === "binary" && group.version === "0.3.0")
    return [{ source: "licenses/supplemental/binary-0.3.0-MIT.txt", text: read("licenses/supplemental/binary-0.3.0-MIT.txt") }];
  if (group.name === "saxes" && group.version === "5.0.1")
    return [{ source: "licenses/supplemental/saxes-5.0.1-LICENSE.txt", text: read("licenses/supplemental/saxes-5.0.1-LICENSE.txt") }];
  if (group.name === "stackback" && group.version === "0.0.2")
    return [{ source: "licenses/supplemental/stackback-0.0.2-MIT.txt", text: read("licenses/supplemental/stackback-0.0.2-MIT.txt") }];
  const files = licenseFiles(path);
  if (!files.length) {
    const readme = readdirSync(join(root, path)).find(name => /^readme(?:\.|$)/i.test(name));
    const text = readme && read(`${path}/${readme}`);
    const match = text && /^#{1,4}\s+licen[cs]e\s*$/im.exec(text);
    if (match) files.push({ source: `${path}/${readme} (license section)`, text: text.slice(match.index) });
  }
  if (!files.length) throw new Error(`Missing notice material: ${group.name}@${group.version}`);
  if (group.name === "pako") files.push({ source: `${path}/lib/zlib/README`, text: read(`${path}/lib/zlib/README`) });
  return files;
}

const excelVersion = JSON.parse(read("node_modules/exceljs/package.json")).version;
const browserNotices = read("licenses/exceljs-browser-NOTICES.txt");
const sourceMapHash = sha(read("node_modules/exceljs/dist/exceljs.min.js.map"));
if (excelVersion !== "4.4.0" || !browserNotices.includes(`Source map SHA-256: ${sourceMapHash}`))
  throw new Error("Review and refresh the ExcelJS browser-vendor notices before building");
if (sha(read("licenses/supplemental/saxes-5.0.1-LICENSE.txt")) !== "0fac2374380621b22e6b50451057721a9c52935b02d16d106a9f04897f061d0e")
  throw new Error("The verified upstream saxes notice changed");

const records = [...groups.values()].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`, "en"));
const texts = new Map();
const header = [
  "GanttDamn - Third-party license notices",
  "",
  "The application's original code is licensed under MIT; see LICENSE.",
  "Third-party code retains its own licenses and copyright notices below.",
  "This file covers npm application and development dependencies, including",
  "optional native variants, and the libraries embedded in ExcelJS's browser bundle.",
  "Development tools and browser executables are not shipped in the app build.",
  "JSZip is used under its MIT option; its original dual-license text is retained.",
  "pako's MIT and zlib notices are both included.",
  "For MPL-2.0 Lightning CSS source: https://github.com/parcel-bundler/lightningcss/tree/v1.30.2",
  "For CC-BY-4.0 caniuse-lite data: https://github.com/browserslist/caniuse-lite",
  "Upstream code is unmodified by GanttDamn. Browser tooling performs compilation/minification.",
  "Native package notices are supplied by their same-version upstream parent package.",
  `Lockfile SHA-256: ${sha(lockText)}`,
  `npm lock entries: ${packages.length}; unique name/version pairs: ${records.length}`,
  "",
];
for (const group of records) {
  const refs = materials(group).map(file => {
    const text = file.text.replace(/\r\n/g, "\n").trimEnd() + "\n";
    const id = sha(text);
    if (!texts.has(id)) texts.set(id, { text, sources: [] });
    texts.get(id).sources.push(file.source);
    return id;
  });
  header.push(`${group.name}@${group.version}`, `License: ${group.license}; declaration: ${group.declared}; scope: ${group.dev ? "development" : "application dependency"}`, `Source: ${group.source}`, `Notice text SHA-256: ${[...new Set(refs)].join(", ")}`, "");
}
for (const [id, data] of texts) {
  header.push("=".repeat(78), `NOTICE TEXT SHA-256: ${id}`, `Sources: ${[...new Set(data.sources)].join("; ")}`, "", data.text);
}
header.push("=".repeat(78), "ADDITIONAL EXCELJS BROWSER-BUNDLE NOTICES", "", browserNotices);
const noticeOutput = header.join("\n");

const counts = new Map();
for (const [path, meta] of packages) { const license = identifiedLicense(path, meta); counts.set(license, (counts.get(license) ?? 0) + 1); }
const report = [
  "# Dependency license record / 依存関係のライセンス記録", "",
  "[日本語README](../README.md#ライセンス) | [English README](../README.en.md#license)", "",
  "## 方針 / Policy", "",
  "GanttDamnは現時点で無償提供し、独自コードは[MIT](../LICENSE)で公開します。第三者コードは各提供元のライセンスに従います。確認した宣言・原文に、必須の有償ライセンス購入条件は見つかっていません。", "",
  "GanttDamn is currently provided free of charge. Its original code is MIT-licensed; third-party code keeps its respective licenses. No mandatory paid-license purchase was identified in the declarations and texts reviewed.", "",
  "## 解消した項目 / Resolved items", "",
  "- `buffers@0.1.1` は[Debian公式のMIT許諾記録と同一コードの照合](../licenses/buffers-provenance.md)で確認しました。npmの宣言は空欄のままですが、配布ソース5ファイルの完全一致と許諾文を保存し、生成時にもハッシュを検査します。",
  "- buffers licensing is identified from the matching official Debian distribution, with the original npm declaration gap explicitly retained. Dependency versions stay unchanged to preserve ExcelJS streaming compatibility.",
  "- `saxes@5.0.1` はnpmに省略された公式原文を補完。`stackback@0.0.2` はnpmのMIT宣言と著者表示を保持し、標準MIT文面の補完元を明記しています。",
  "- JSZipはMITの選択肢を採用。pakoはMITとZlibの両方の通知文を収録しています。",
  "- ExcelJSの事前ビルド済みブラウザ版の内包コードも別途確認し、[通知文](../licenses/exceljs-browser-NOTICES.txt)と[出典・照合方法](../licenses/exceljs-browser-provenance.md)を保存しています。Source-matched versions are reference versions; identical source may occur in multiple releases.", "",
  "## 配布資料 / Distribution materials", "",
  "- [LICENSE](../LICENSE): GanttDamn original code / アプリ独自コード。",
  "- [THIRD_PARTY_NOTICES.txt](../THIRD_PARTY_NOTICES.txt): npm本体・開発用依存の原文・NOTICEと、ブラウザ版内包コードの通知。開発ツールのバイナリ自体はアプリビルドに含めません。",
  "- [Supplemental sources](../licenses/README.md): npmに省略された文面等の出典。",
  "- Builds include `LICENSE.txt` and `THIRD_PARTY_NOTICES.txt` in `dist/`. Build checks reject stale notices, licenses without declaration or verified evidence, or a changed ExcelJS browser snapshot.", "",
  "MPL-2.0の対象ソースは[Lightning CSS v1.30.2](https://github.com/parcel-bundler/lightningcss/tree/v1.30.2)、CC-BY-4.0のデータ出典は[caniuse-lite](https://github.com/browserslist/caniuse-lite)です。これらは開発用依存です。OS・Node.js・Chrome等の実行環境本体や、それらを再配布するパッケージはこのアプリ配布物に含めません。", "",
  "## 再生成 / Regeneration", "",
  "```sh", "npm run licenses:generate", "npm run licenses:check", "npm run build", "```", "",
  "生成処理はローカルのロックファイル・ライセンス文面を読み取るだけで、外部通信をしません。依存・配布内容の変更時は原文と通知を再確認してください。再配布するコードを変更した場合は、そのライセンスに従って変更表示・対象ソース提供なども更新します。", "",
  "Generation reads local files only. Recheck notices and applicable source/attribution obligations after dependency or distribution changes. This inventory describes declarations and collected notices; it does not relicense upstream code or audit operating-system/browser software.", "",
  "## Snapshot / 確認対象", "",
  `- Lockfile SHA-256: \`${sha(lockText)}\``,
  `- Lock entries: ${packages.length}; unique name/version pairs: ${records.length}; unresolved licenses: 0; raw declarations missing: 1 (buffers, verified from matching source).`,
  `- Direct dependencies: ${Object.keys(manifest.dependencies).length} application + ${Object.keys(manifest.devDependencies).length} development.`,
  "- Scope below describes dependency-tree placement, not browser inclusion. / 区分は依存ツリーの所属で、ブラウザへの同梱を示しません。", "",
  "## Identified-license counts / 確認済みライセンス別件数", "",
  "| License | Lock entries |", "|---|---:|",
  ...[...counts].sort(([a], [b]) => a.localeCompare(b, "en")).map(([license, count]) => `| ${license} | ${count} |`), "",
  "## npm inventory / npm依存一覧", "",
  "| Package | Version | Identified license | Scope | Lock entries |", "|---|---|---|---|---:|",
  ...records.map(group => `| \`${group.name}\` | ${group.version} | ${group.license} | ${group.dev ? "Development" : "Application"} | ${group.paths.length} |`), "",
].join("\n");

for (const [path, content] of [["THIRD_PARTY_NOTICES.txt", noticeOutput], ["docs/dependency-licenses.md", report]]) {
  if (process.argv.includes("--check")) {
    if (!existsSync(resolve(root, path)) || read(path) !== content)
      throw new Error(`${path} is stale. Run npm run licenses:generate and review the changes.`);
  } else writeFileSync(resolve(root, path), content);
}
console.log(`License notices ${process.argv.includes("--check") ? "verified" : "generated"}: ${packages.length} lock entries, ${records.length} packages; browser vendor notices included.`);
