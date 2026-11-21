# Dependency license record / 依存関係のライセンス記録

[日本語README](../README.md#ライセンス) | [English README](../README.en.md#license)

## 方針 / Policy

GanttDamnは現時点で無償提供し、独自コードは[MIT](../LICENSE)で公開します。第三者コードは各提供元のライセンスに従います。確認した宣言・原文に、必須の有償ライセンス購入条件は見つかっていません。

GanttDamn is currently provided free of charge. Its original code is MIT-licensed; third-party code keeps its respective licenses. No mandatory paid-license purchase was identified in the declarations and texts reviewed.

## 解消した項目 / Resolved items

- `buffers@0.1.1` は[Debian公式のMIT許諾記録と同一コードの照合](../licenses/buffers-provenance.md)で確認しました。npmの宣言は空欄のままですが、配布ソース5ファイルの完全一致と許諾文を保存し、生成時にもハッシュを検査します。
- buffers licensing is identified from the matching official Debian distribution, with the original npm declaration gap explicitly retained. Dependency versions stay unchanged to preserve ExcelJS streaming compatibility.
- `saxes@5.0.1` はnpmに省略された公式原文を補完。`stackback@0.0.2` はnpmのMIT宣言と著者表示を保持し、標準MIT文面の補完元を明記しています。
- JSZipはMITの選択肢を採用。pakoはMITとZlibの両方の通知文を収録しています。
- ExcelJSの事前ビルド済みブラウザ版の内包コードも別途確認し、[通知文](../licenses/exceljs-browser-NOTICES.txt)と[出典・照合方法](../licenses/exceljs-browser-provenance.md)を保存しています。Source-matched versions are reference versions; identical source may occur in multiple releases.

## 配布資料 / Distribution materials

- [LICENSE](../LICENSE): GanttDamn original code / アプリ独自コード。
- [THIRD_PARTY_NOTICES.txt](../THIRD_PARTY_NOTICES.txt): npm本体・開発用依存の原文・NOTICEと、ブラウザ版内包コードの通知。開発ツールのバイナリ自体はアプリビルドに含めません。
- [Supplemental sources](../licenses/README.md): npmに省略された文面等の出典。
- Builds include `LICENSE.txt` and `THIRD_PARTY_NOTICES.txt` in `dist/`. Build checks reject stale notices, licenses without declaration or verified evidence, or a changed ExcelJS browser snapshot.

MPL-2.0の対象ソースは[Lightning CSS v1.30.2](https://github.com/parcel-bundler/lightningcss/tree/v1.30.2)、CC-BY-4.0のデータ出典は[caniuse-lite](https://github.com/browserslist/caniuse-lite)です。これらは開発用依存です。OS・Node.js・Chrome等の実行環境本体や、それらを再配布するパッケージはこのアプリ配布物に含めません。

## 再生成 / Regeneration

```sh
npm run licenses:generate
npm run licenses:check
npm run build
```

生成処理はローカルのロックファイル・ライセンス文面を読み取るだけで、外部通信をしません。依存・配布内容の変更時は原文と通知を再確認してください。再配布するコードを変更した場合は、そのライセンスに従って変更表示・対象ソース提供なども更新します。

Generation reads local files only. Recheck notices and applicable source/attribution obligations after dependency or distribution changes. This inventory describes declarations and collected notices; it does not relicense upstream code or audit operating-system/browser software.

## Snapshot / 確認対象

- Lockfile SHA-256: `24bf2a06e002a2c934baad94d63a5814603ed7ea2a88cec6c2a820eb82fa90e8`
- Lock entries: 380; unique name/version pairs: 363; unresolved licenses: 0; raw declarations missing: 1 (buffers, verified from matching source).
- Direct dependencies: 5 application + 11 development.
- Scope below describes dependency-tree placement, not browser inclusion. / 区分は依存ツリーの所属で、ブラウザへの同梱を示しません。

## Identified-license counts / 確認済みライセンス別件数

| License | Lock entries |
|---|---:|
| (MIT AND Zlib) | 1 |
| (MIT OR GPL-3.0-or-later) | 1 |
| Apache-2.0 | 10 |
| BlueOak-1.0.0 | 1 |
| BSD-3-Clause | 3 |
| CC-BY-4.0 | 1 |
| ISC | 18 |
| MIT | 331 |
| MIT/X11 | 1 |
| MPL-2.0 | 12 |
| Unlicense | 1 |

## npm inventory / npm依存一覧

| Package | Version | Identified license | Scope | Lock entries |
|---|---|---|---|---:|
| `@babel/code-frame` | 7.29.7 | MIT | Development | 1 |
| `@babel/compat-data` | 7.29.7 | MIT | Development | 1 |
| `@babel/core` | 7.29.13 | MIT | Development | 1 |
| `@babel/generator` | 7.29.15 | MIT | Development | 1 |
| `@babel/helper-compilation-targets` | 7.29.13 | MIT | Development | 1 |
| `@babel/helper-globals` | 7.29.7 | MIT | Development | 1 |
| `@babel/helper-module-imports` | 7.29.7 | MIT | Development | 1 |
| `@babel/helper-module-transforms` | 7.29.14 | MIT | Development | 1 |
| `@babel/helper-plugin-utils` | 7.29.7 | MIT | Development | 1 |
| `@babel/helper-string-parser` | 7.29.15 | MIT | Development | 1 |
| `@babel/helper-validator-identifier` | 7.29.7 | MIT | Development | 1 |
| `@babel/helper-validator-option` | 7.29.7 | MIT | Development | 1 |
| `@babel/helpers` | 7.29.15 | MIT | Development | 1 |
| `@babel/parser` | 7.29.15 | MIT | Development | 1 |
| `@babel/plugin-transform-react-jsx-self` | 7.29.7 | MIT | Development | 1 |
| `@babel/plugin-transform-react-jsx-source` | 7.29.7 | MIT | Development | 1 |
| `@babel/template` | 7.29.7 | MIT | Development | 1 |
| `@babel/traverse` | 7.29.15 | MIT | Development | 1 |
| `@babel/types` | 7.29.15 | MIT | Development | 1 |
| `@esbuild/aix-ppc64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/android-arm` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/android-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/android-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/darwin-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/darwin-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/freebsd-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/freebsd-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-arm` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-ia32` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-loong64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-mips64el` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-ppc64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-riscv64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-s390x` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/linux-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/netbsd-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/netbsd-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/openbsd-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/openbsd-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/openharmony-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/sunos-x64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/win32-arm64` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/win32-ia32` | 0.28.2 | MIT | Development | 1 |
| `@esbuild/win32-x64` | 0.28.2 | MIT | Development | 1 |
| `@fast-csv/format` | 4.3.5 | MIT | Application | 1 |
| `@fast-csv/parse` | 4.3.6 | MIT | Application | 1 |
| `@jridgewell/gen-mapping` | 0.3.13 | MIT | Development | 1 |
| `@jridgewell/remapping` | 2.3.5 | MIT | Development | 1 |
| `@jridgewell/resolve-uri` | 3.1.3 | MIT | Development | 1 |
| `@jridgewell/sourcemap-codec` | 1.6.0 | MIT | Development | 1 |
| `@jridgewell/trace-mapping` | 0.3.31 | MIT | Development | 1 |
| `@playwright/test` | 1.56.1 | Apache-2.0 | Development | 1 |
| `@rolldown/pluginutils` | 1.0.0-beta.43 | MIT | Development | 1 |
| `@rollup/rollup-android-arm-eabi` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-android-arm64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-android-x64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-darwin-arm64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-darwin-x64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-freebsd-arm64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-freebsd-x64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-arm-gnueabihf` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-arm-musleabihf` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-arm64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-arm64-musl` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-loong64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-loong64-musl` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-ppc64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-ppc64-musl` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-riscv64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-riscv64-musl` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-s390x-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-x64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-linux-x64-musl` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-openbsd-x64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-openharmony-arm64` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-win32-arm64-msvc` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-win32-ia32-msvc` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-win32-x64-gnu` | 4.68.7 | MIT | Development | 1 |
| `@rollup/rollup-win32-x64-msvc` | 4.68.7 | MIT | Development | 1 |
| `@standard-schema/spec` | 1.1.0 | MIT | Development | 1 |
| `@tailwindcss/node` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-android-arm64` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-darwin-arm64` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-darwin-x64` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-freebsd-x64` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-linux-arm-gnueabihf` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-linux-arm64-gnu` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-linux-arm64-musl` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-linux-x64-gnu` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-linux-x64-musl` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-wasm32-wasi` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-win32-arm64-msvc` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide-win32-x64-msvc` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/oxide` | 4.1.17 | MIT | Development | 1 |
| `@tailwindcss/vite` | 4.1.17 | MIT | Development | 1 |
| `@types/babel__core` | 7.20.5 | MIT | Development | 1 |
| `@types/babel__generator` | 7.27.0 | MIT | Development | 1 |
| `@types/babel__template` | 7.4.4 | MIT | Development | 1 |
| `@types/babel__traverse` | 7.28.0 | MIT | Development | 1 |
| `@types/chai` | 5.2.3 | MIT | Development | 1 |
| `@types/deep-eql` | 4.0.2 | MIT | Development | 1 |
| `@types/estree` | 1.0.10 | MIT | Development | 1 |
| `@types/node` | 14.18.63 | MIT | Application | 2 |
| `@types/node` | 22.19.0 | MIT | Development | 1 |
| `@types/react-dom` | 19.2.0 | MIT | Development | 1 |
| `@types/react` | 19.2.0 | MIT | Development | 1 |
| `@vitejs/plugin-react` | 5.1.0 | MIT | Development | 1 |
| `@vitest/expect` | 4.1.12 | MIT | Development | 1 |
| `@vitest/mocker` | 4.1.12 | MIT | Development | 1 |
| `@vitest/pretty-format` | 4.1.12 | MIT | Development | 1 |
| `@vitest/runner` | 4.1.12 | MIT | Development | 1 |
| `@vitest/snapshot` | 4.1.12 | MIT | Development | 1 |
| `@vitest/spy` | 4.1.12 | MIT | Development | 1 |
| `@vitest/utils` | 4.1.12 | MIT | Development | 1 |
| `archiver-utils` | 2.1.0 | MIT | Application | 1 |
| `archiver-utils` | 3.0.4 | MIT | Application | 1 |
| `archiver` | 5.3.2 | MIT | Application | 1 |
| `array-buffer-byte-length` | 1.0.2 | MIT | Application | 1 |
| `arraybuffer.prototype.slice` | 1.0.4 | MIT | Application | 1 |
| `assertion-error` | 2.0.1 | MIT | Development | 1 |
| `async-function` | 1.0.0 | MIT | Application | 1 |
| `async` | 3.2.6 | MIT | Application | 1 |
| `available-typed-arrays` | 1.0.7 | MIT | Application | 1 |
| `balanced-match` | 1.0.2 | MIT | Application | 1 |
| `base64-js` | 1.5.1 | MIT | Application | 1 |
| `baseline-browser-mapping` | 2.11.39 | Apache-2.0 | Development | 1 |
| `big-integer` | 1.6.52 | Unlicense | Application | 1 |
| `binary` | 0.3.0 | MIT | Application | 1 |
| `bl` | 4.1.0 | MIT | Application | 1 |
| `bluebird` | 3.4.7 | MIT | Application | 1 |
| `brace-expansion` | 1.1.22 | MIT | Application | 1 |
| `brace-expansion` | 2.1.8 | MIT | Application | 1 |
| `browserslist` | 4.29.6 | MIT | Development | 1 |
| `buffer-crc32` | 0.2.13 | MIT | Application | 1 |
| `buffer-indexof-polyfill` | 1.0.2 | MIT | Application | 1 |
| `buffer` | 5.7.1 | MIT | Application | 1 |
| `buffers` | 0.1.1 | MIT | Application | 1 |
| `call-bind-apply-helpers` | 1.0.2 | MIT | Application | 1 |
| `call-bind` | 1.0.9 | MIT | Application | 1 |
| `call-bound` | 1.0.4 | MIT | Application | 1 |
| `caniuse-lite` | 1.0.30001826 | CC-BY-4.0 | Development | 1 |
| `chai` | 6.3.0 | MIT | Development | 1 |
| `chainsaw` | 0.1.0 | MIT/X11 | Application | 1 |
| `compress-commons` | 4.1.2 | MIT | Application | 1 |
| `concat-map` | 0.0.1 | MIT | Application | 1 |
| `convert-source-map` | 2.0.0 | MIT | Development | 1 |
| `core-util-is` | 1.0.3 | MIT | Application | 1 |
| `crc-32` | 1.2.2 | Apache-2.0 | Application | 1 |
| `crc32-stream` | 4.0.3 | MIT | Application | 1 |
| `csstype` | 3.2.4 | MIT | Development | 1 |
| `data-view-buffer` | 1.0.2 | MIT | Application | 1 |
| `data-view-byte-length` | 1.0.2 | MIT | Application | 1 |
| `data-view-byte-offset` | 1.0.1 | MIT | Application | 1 |
| `date-fns` | 4.1.0 | MIT | Application | 1 |
| `dayjs` | 1.11.23 | MIT | Application | 1 |
| `debug` | 4.4.3 | MIT | Development | 1 |
| `define-data-property` | 1.1.4 | MIT | Application | 1 |
| `define-properties` | 1.2.1 | MIT | Application | 1 |
| `detect-libc` | 2.1.2 | Apache-2.0 | Development | 1 |
| `dunder-proto` | 1.0.1 | MIT | Application | 1 |
| `duplexer2` | 0.1.4 | BSD-3-Clause | Application | 1 |
| `electron-to-chromium` | 1.5.492 | ISC | Development | 1 |
| `end-of-stream` | 1.4.5 | MIT | Application | 1 |
| `enhanced-resolve` | 5.27.0 | MIT | Development | 1 |
| `es-abstract-get` | 1.0.0 | MIT | Application | 1 |
| `es-abstract` | 1.24.2 | MIT | Application | 1 |
| `es-define-property` | 1.0.1 | MIT | Application | 1 |
| `es-errors` | 1.3.0 | MIT | Application | 1 |
| `es-module-lexer` | 2.3.2 | MIT | Development | 1 |
| `es-object-atoms` | 1.1.2 | MIT | Application | 1 |
| `es-set-tostringtag` | 2.1.0 | MIT | Application | 1 |
| `es-to-primitive` | 1.3.4 | MIT | Application | 1 |
| `esbuild` | 0.28.2 | MIT | Development | 1 |
| `escalade` | 3.2.0 | MIT | Development | 1 |
| `estree-walker` | 3.0.3 | MIT | Development | 1 |
| `exceljs` | 4.4.0 | MIT | Application | 1 |
| `expect-type` | 1.4.0 | Apache-2.0 | Development | 1 |
| `fake-indexeddb` | 6.2.4 | Apache-2.0 | Development | 1 |
| `fast-csv` | 4.3.6 | MIT | Application | 1 |
| `fdir` | 6.5.0 | MIT | Development | 1 |
| `for-each` | 0.3.5 | MIT | Application | 1 |
| `fs-constants` | 1.0.0 | MIT | Application | 1 |
| `fs.realpath` | 1.0.0 | ISC | Application | 1 |
| `fsevents` | 2.3.2 | MIT | Development | 1 |
| `fsevents` | 2.3.3 | MIT | Development | 1 |
| `fstream` | 1.0.12 | ISC | Application | 1 |
| `function-bind` | 1.1.2 | MIT | Application | 1 |
| `function.prototype.name` | 1.2.0 | MIT | Application | 1 |
| `functions-have-names` | 1.2.3 | MIT | Application | 1 |
| `generator-function` | 2.0.1 | MIT | Application | 1 |
| `gensync` | 1.0.0-beta.2 | MIT | Development | 1 |
| `get-intrinsic` | 1.3.0 | MIT | Application | 1 |
| `get-proto` | 1.0.1 | MIT | Application | 1 |
| `get-symbol-description` | 1.1.0 | MIT | Application | 1 |
| `glob` | 7.2.3 | ISC | Application | 1 |
| `globalthis` | 1.0.4 | MIT | Application | 1 |
| `gopd` | 1.2.0 | MIT | Application | 1 |
| `graceful-fs` | 4.2.12 | BlueOak-1.0.0 | Application | 1 |
| `has-bigints` | 1.1.0 | MIT | Application | 1 |
| `has-property-descriptors` | 1.0.2 | MIT | Application | 1 |
| `has-proto` | 1.2.0 | MIT | Application | 1 |
| `has-symbols` | 1.1.0 | MIT | Application | 1 |
| `has-tostringtag` | 1.0.2 | MIT | Application | 1 |
| `hasown` | 2.0.4 | MIT | Application | 1 |
| `ieee754` | 1.2.1 | BSD-3-Clause | Application | 1 |
| `immediate` | 3.0.6 | MIT | Application | 1 |
| `inflight` | 1.0.6 | ISC | Application | 1 |
| `inherits` | 2.0.4 | ISC | Application | 1 |
| `internal-slot` | 1.1.0 | MIT | Application | 1 |
| `is-array-buffer` | 3.0.5 | MIT | Application | 1 |
| `is-async-function` | 2.1.1 | MIT | Application | 1 |
| `is-bigint` | 1.1.0 | MIT | Application | 1 |
| `is-boolean-object` | 1.2.2 | MIT | Application | 1 |
| `is-callable` | 1.2.7 | MIT | Application | 1 |
| `is-data-view` | 1.0.2 | MIT | Application | 1 |
| `is-date-object` | 1.1.0 | MIT | Application | 1 |
| `is-document.all` | 1.0.0 | MIT | Application | 1 |
| `is-finalizationregistry` | 1.1.1 | MIT | Application | 1 |
| `is-generator-function` | 1.1.2 | MIT | Application | 1 |
| `is-map` | 2.0.3 | MIT | Application | 1 |
| `is-negative-zero` | 2.0.3 | MIT | Application | 1 |
| `is-number-object` | 1.1.1 | MIT | Application | 1 |
| `is-regex` | 1.2.1 | MIT | Application | 1 |
| `is-set` | 2.0.3 | MIT | Application | 1 |
| `is-shared-array-buffer` | 1.0.4 | MIT | Application | 1 |
| `is-string` | 1.1.1 | MIT | Application | 1 |
| `is-symbol` | 1.1.1 | MIT | Application | 1 |
| `is-typed-array` | 1.1.15 | MIT | Application | 1 |
| `is-weakmap` | 2.0.2 | MIT | Application | 1 |
| `is-weakref` | 1.1.1 | MIT | Application | 1 |
| `is-weakset` | 2.0.4 | MIT | Application | 1 |
| `isarray` | 1.0.0 | MIT | Application | 5 |
| `isarray` | 2.0.5 | MIT | Application | 1 |
| `jiti` | 2.7.0 | MIT | Development | 1 |
| `js-tokens` | 4.0.0 | MIT | Development | 1 |
| `jsesc` | 3.1.0 | MIT | Development | 1 |
| `json5` | 2.2.3 | MIT | Development | 1 |
| `jszip` | 3.10.2 | (MIT OR GPL-3.0-or-later) | Application | 1 |
| `lazystream` | 1.0.1 | MIT | Application | 1 |
| `lie` | 3.3.0 | MIT | Application | 1 |
| `lightningcss-android-arm64` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-darwin-arm64` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-darwin-x64` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-freebsd-x64` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-linux-arm-gnueabihf` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-linux-arm64-gnu` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-linux-arm64-musl` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-linux-x64-gnu` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-linux-x64-musl` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-win32-arm64-msvc` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss-win32-x64-msvc` | 1.30.2 | MPL-2.0 | Development | 1 |
| `lightningcss` | 1.30.2 | MPL-2.0 | Development | 1 |
| `listenercount` | 1.0.1 | ISC | Application | 1 |
| `lodash.defaults` | 4.2.0 | MIT | Application | 1 |
| `lodash.difference` | 4.5.0 | MIT | Application | 1 |
| `lodash.escaperegexp` | 4.1.2 | MIT | Application | 1 |
| `lodash.flatten` | 4.4.0 | MIT | Application | 1 |
| `lodash.groupby` | 4.6.0 | MIT | Application | 1 |
| `lodash.isboolean` | 3.0.3 | MIT | Application | 1 |
| `lodash.isequal` | 4.5.0 | MIT | Application | 1 |
| `lodash.isfunction` | 3.0.9 | MIT | Application | 1 |
| `lodash.isnil` | 4.0.0 | MIT | Application | 1 |
| `lodash.isplainobject` | 4.0.6 | MIT | Application | 1 |
| `lodash.isundefined` | 3.0.1 | MIT | Application | 1 |
| `lodash.union` | 4.6.0 | MIT | Application | 1 |
| `lodash.uniq` | 4.5.0 | MIT | Application | 1 |
| `lru-cache` | 5.1.1 | ISC | Development | 1 |
| `magic-string` | 0.30.21 | MIT | Development | 1 |
| `math-intrinsics` | 1.1.0 | MIT | Application | 1 |
| `minimatch` | 3.1.5 | ISC | Application | 1 |
| `minimatch` | 5.1.9 | ISC | Application | 1 |
| `minimist` | 1.2.8 | MIT | Application | 1 |
| `mkdirp` | 0.5.6 | MIT | Application | 1 |
| `ms` | 2.1.3 | MIT | Development | 1 |
| `nanoid` | 3.3.20 | MIT | Development | 1 |
| `node-releases` | 2.0.65 | MIT | Development | 1 |
| `normalize-path` | 3.0.0 | MIT | Application | 1 |
| `object-inspect` | 1.14.0 | MIT | Application | 1 |
| `object-keys` | 1.1.1 | MIT | Application | 1 |
| `object.assign` | 4.1.7 | MIT | Application | 1 |
| `obug` | 2.2.1 | MIT | Development | 1 |
| `once` | 1.4.0 | ISC | Application | 1 |
| `own-keys` | 1.0.2 | MIT | Application | 1 |
| `pako` | 1.0.11 | (MIT AND Zlib) | Application | 1 |
| `path-is-absolute` | 1.0.1 | MIT | Application | 1 |
| `pathe` | 2.0.3 | MIT | Development | 1 |
| `picocolors` | 1.1.1 | ISC | Development | 1 |
| `picomatch` | 4.0.7 | MIT | Development | 1 |
| `playwright-core` | 1.56.1 | Apache-2.0 | Development | 1 |
| `playwright` | 1.56.1 | Apache-2.0 | Development | 1 |
| `possible-typed-array-names` | 1.1.0 | MIT | Application | 1 |
| `postcss` | 8.5.33 | MIT | Development | 1 |
| `process-nextick-args` | 2.0.1 | MIT | Application | 1 |
| `react-dom` | 19.2.0 | MIT | Application | 1 |
| `react-refresh` | 0.18.0 | MIT | Development | 1 |
| `react` | 19.2.0 | MIT | Application | 1 |
| `readable-stream` | 2.3.8 | MIT | Application | 5 |
| `readable-stream` | 3.6.2 | MIT | Application | 1 |
| `readdir-glob` | 1.1.3 | Apache-2.0 | Application | 1 |
| `reflect.getprototypeof` | 1.0.10 | MIT | Application | 1 |
| `regexp.prototype.flags` | 1.5.4 | MIT | Application | 1 |
| `rimraf` | 2.7.1 | ISC | Application | 1 |
| `rollup` | 4.68.7 | MIT | Development | 1 |
| `safe-array-concat` | 1.1.4 | MIT | Application | 1 |
| `safe-buffer` | 5.1.2 | MIT | Application | 5 |
| `safe-buffer` | 5.2.1 | MIT | Application | 1 |
| `safe-push-apply` | 1.0.0 | MIT | Application | 1 |
| `safe-regex-test` | 1.1.0 | MIT | Application | 1 |
| `saxes` | 5.0.1 | ISC | Application | 1 |
| `scheduler` | 0.27.0 | MIT | Application | 1 |
| `semver` | 6.3.2 | ISC | Development | 1 |
| `set-function-length` | 1.2.2 | MIT | Application | 1 |
| `set-function-name` | 2.0.2 | MIT | Application | 1 |
| `set-proto` | 1.0.0 | MIT | Application | 1 |
| `setimmediate` | 1.0.5 | MIT | Application | 1 |
| `side-channel-list` | 1.0.1 | MIT | Application | 1 |
| `side-channel-map` | 1.0.1 | MIT | Application | 1 |
| `side-channel-weakmap` | 1.0.2 | MIT | Application | 1 |
| `side-channel` | 1.1.1 | MIT | Application | 1 |
| `siginfo` | 2.0.0 | ISC | Development | 1 |
| `source-map-js` | 1.2.4 | BSD-3-Clause | Development | 1 |
| `stackback` | 0.0.2 | MIT | Development | 1 |
| `std-env` | 4.3.0 | MIT | Development | 1 |
| `stop-iteration-iterator` | 1.1.0 | MIT | Application | 1 |
| `string_decoder` | 1.1.1 | MIT | Application | 5 |
| `string_decoder` | 1.3.0 | MIT | Application | 1 |
| `string.prototype.trim` | 1.2.11 | MIT | Application | 1 |
| `string.prototype.trimend` | 1.0.10 | MIT | Application | 1 |
| `string.prototype.trimstart` | 1.0.8 | MIT | Application | 1 |
| `tailwindcss` | 4.1.17 | MIT | Development | 1 |
| `tapable` | 2.3.4 | MIT | Development | 1 |
| `tar-stream` | 2.2.0 | MIT | Application | 1 |
| `tinybench` | 2.9.0 | MIT | Development | 1 |
| `tinyexec` | 1.3.1 | MIT | Development | 1 |
| `tinyglobby` | 0.2.17 | MIT | Development | 1 |
| `tinyrainbow` | 3.2.0 | MIT | Development | 1 |
| `tmp` | 0.2.7 | MIT | Application | 1 |
| `traverse` | 0.3.10 | MIT | Application | 1 |
| `typed-array-buffer` | 1.0.3 | MIT | Application | 1 |
| `typed-array-byte-length` | 1.0.3 | MIT | Application | 1 |
| `typed-array-byte-offset` | 1.0.5 | MIT | Application | 1 |
| `typed-array-length` | 1.0.8 | MIT | Application | 1 |
| `typedarray.prototype.slice` | 1.0.6 | MIT | Application | 1 |
| `typescript` | 5.9.3 | Apache-2.0 | Development | 1 |
| `unbox-primitive` | 1.1.0 | MIT | Application | 1 |
| `undici-types` | 6.21.0 | MIT | Development | 1 |
| `unzipper` | 0.10.14 | MIT | Application | 1 |
| `update-browserslist-db` | 1.4.0 | MIT | Development | 1 |
| `util-deprecate` | 1.0.2 | MIT | Application | 1 |
| `uuid` | 11.1.1 | MIT | Application | 1 |
| `vite` | 7.3.8 | MIT | Development | 1 |
| `vitest` | 4.1.12 | MIT | Development | 1 |
| `which-boxed-primitive` | 1.1.1 | MIT | Application | 1 |
| `which-builtin-type` | 1.2.1 | MIT | Application | 1 |
| `which-collection` | 1.0.2 | MIT | Application | 1 |
| `which-typed-array` | 1.1.24 | MIT | Application | 1 |
| `why-is-node-running` | 2.3.0 | MIT | Development | 1 |
| `wrappy` | 1.0.2 | ISC | Application | 1 |
| `xmlchars` | 2.2.0 | MIT | Application | 1 |
| `yallist` | 3.1.1 | ISC | Development | 1 |
| `zip-stream` | 4.1.1 | MIT | Application | 1 |
| `zustand` | 5.0.8 | MIT | Application | 1 |
