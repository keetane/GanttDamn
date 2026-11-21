# Network verification / 外部通信の確認記録

[日本語README](../README.md#データ送信と外部通信) | [English README](../README.en.md#data-transmission-and-external-connections)

## 確認結果

確認日：2026-11-22。Google Chromeの新規・隔離コンテキストで、Vite開発版と本番ビルドのプレビューを確認しました。確認した操作では、アプリからローカルサーバー以外へのHTTPリクエスト・WebSocket接続の試行は0件でした。

| 観測項目 | 開発版 | ビルド版プレビュー |
|---|---:|---:|
| 接続先 | `http://127.0.0.1:4327` | `http://127.0.0.1:4328` |
| 観測したHTTPリクエスト | 63 | 7 |
| HTTPメソッド | GETのみ | GETのみ |
| 外部宛HTTPリクエスト | 0 | 0 |
| 外部宛WebSocket接続試行 | 0 | 0 |
| ローカルWebSocket接続 | 2 | 0 |
| 確認用ラベルがHTTP URL・本文に含まれたリクエスト | 0 | 0 |
| 確認用ラベルが観測したWebSocket送信フレームに含まれた件数 | 0 | 0 |
| Service Worker | 0 | 0 |
| ブラウザ内の未処理エラー | 0 | 0 |

HTTP通信はアプリとスクリプト・スタイルシート等の読み込みで、すべてテスト対象の同一オリジンでした。開発版のWebSocketはViteの更新通知用で、初回表示・再読み込みに伴うローカル接続です。通常のランチャー起動ではポート4317を使います。

## ソースの確認

| 処理 | 実装と確認内容 |
|---|---|
| PJ保存 | [db.ts](../src/storage/db.ts)のIndexedDBへ保存。クラウド保存APIはない |
| 言語設定 | [i18n.ts](../src/i18n.ts)のlocalStorageに保存 |
| JSON読み込み | [App.tsx](../src/App.tsx)で選択したファイルを `File.text()` で読み、検証してローカル保存 |
| プレビュー | App.tsxで生成したSVGをdata URLとして表示 |
| PNG/SVG/XLSX/JSON出力 | [chartExport.ts](../src/export/chartExport.ts)とApp.tsxで生成し、Blobのダウンロードとして保存。ExcelJSもローカル配信のモジュールとして読み込み |
| フォント・画像 | [styles.css](../src/styles.css)はシステムフォントを参照。矢印は埋め込みSVG。外部CDN・Webフォントを読み込む指定はない |
| HTMLフォーム | App.tsxで `preventDefault()` を使用し、作成・名前変更をローカル処理 |
| ランチャー | [launcher.mjs](../scripts/launcher.mjs)の `fetch` は固定の `http://127.0.0.1:4317/` の起動確認のみ。Viteをループバックアドレスで起動 |

`fetch`、XHR、WebSocket、EventSource、sendBeacon、外部URL、画像・CSS読み込み、フォーム等を検索し、実行対象のアプリコードに外部アップロード・アクセス解析・テレメトリーの処理は確認されませんでした。SVGに含まれる `http://www.w3.org/2000/svg` は名前空間の識別子です。

## 操作による確認

以下の操作を開発版・ビルド版の両方で実行しました。

1. 初期表示とPJのバーラベル・補足の編集、手動保存。
2. 行追加、セルの塗りつぶし、ダイヤモンドの追加。
3. Damn itのまとめ移動、Undo、Redo。
4. 1時間・日・週・Q・月の切替、今日へのジャンプ、表示設定。
5. 日本語・英語の切替、PJの複製、`all` / `all project name` の表示。
6. プレビュー、PNG・SVG・XLSX・JSONのダウンロード。
7. 全PJバックアップのダウンロードとローカルファイルからの復元。
8. 元のPJへの切替・保存・再読み込みと、ラベルの保持確認。

URLを含むダミーのバーラベルを入力し、HTTPリクエストURL・本文と観測したWebSocket送信フレームへの混入も調べました。実際の利用者のPJやブラウザプロファイルは使っていません。

PlaywrightでHTTPリクエストとWebSocket接続を監視しました。外部宛を検出した場合は送信前に遮断し、試行が1件でもあればテストを失敗させる構成です。今回、遮断対象となる外部宛試行自体がありませんでした。最後の操作後も2秒間観測しています。

## 再実行

依存パッケージとGoogle Chromeを準備し、ポート4327・4328を空けて実行します。

```sh
npm run build
npm run test:e2e -- --config playwright.network.config.ts
```

設定：[playwright.network.config.ts](../playwright.network.config.ts)。操作・検証：[network.spec.ts](../tests/network.spec.ts)。結果は `test-results/` 内の各テストの `network-summary.json` に保存します。

## 確認範囲

これは現在のソースと上記の操作シナリオに対する確認です。全コード経路・将来の変更・長時間実行を含む恒久的な無通信の保証ではありません。

依存導入時のnpmのパッケージ取得、OS・ブラウザ本体・拡張機能のバックグラウンド通信や同期は対象外です。また、OS全体のパケットキャプチャや、Vite等のツール内部を含む全依存コードの包括的なネットワーク監査は行っていません。

## English summary

Reviewed on 2026-11-22 using fresh, isolated Google Chrome contexts. The development server (`127.0.0.1:4327`) and the built-app preview (`127.0.0.1:4328`) passed the same interaction test. **Neither run attempted an off-origin HTTP request or WebSocket connection.** All observed HTTP requests were same-origin GETs: 63 in development and 7 in the built preview. Development opened two local Vite WebSockets across initial load and reload; the built preview opened none.

The test covered editing and saving projects, rows and diamonds, Damn it movement, undo/redo, all five scales, date navigation, settings, language switching, duplication, both overview modes, all four export formats, full backups, JSON restoration, and reload persistence. A URL-containing dummy label did not appear in recorded request URLs, request bodies, or observed outgoing WebSocket frames. There were no service workers or unhandled page errors.

Source inspection found browser-local IndexedDB persistence, localStorage language settings, local file reads for JSON imports, and browser-generated data/Blob previews and downloads. No external upload, analytics, or telemetry implementation was found in the application code. The launcher only probes the fixed local app URL on port 4317. External fonts and CDN assets are not configured.

Off-origin HTTP and WebSocket attempts are intercepted before being sent, recorded, and cause test failure. No such attempt occurred. Observation continues for two seconds after the final action. Run the commands above to repeat the checks; the JSON summaries are written under `test-results/`.

The scope is the current source and tested workflows, not every code path, future change, or indefinite execution. npm dependency downloads, OS/browser/extension traffic and synchronization, system-wide packet capture, and a comprehensive audit of all tool internals are outside this review.
