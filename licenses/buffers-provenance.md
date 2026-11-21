# buffers 0.1.1: verified source and license evidence

The npm package has no license declaration. The Debian-maintained distribution explicitly records MIT for the upstream source, citing the upstream package.json licensing commit. We compared the npm artifact with the official Debian original source archive: all five non-metadata files are byte-identical. This record preserves that evidence and the license notice without modifying the dependency or assigning a new license to upstream code.

- [Official source archive](https://deb.debian.org/debian/pool/main/n/node-buffers/node-buffers_0.1.1.orig.tar.gz)
- Archive SHA-256: `f8de49c60e467005182d9687b5d87775bbcec6385ac63220b7741327441deb6d`
- [Official copyright record](https://sources.debian.org/data/main/n/node-buffers/0.1.1-2/debian/copyright)
- [Local copy](supplemental/buffers-0.1.1-COPYRIGHT.txt), SHA-256: `97423a03bc4476a98de2bf3fa7efff55b3f338da76a7b3cbf747b4dc6f52a056`
- [Formatted distribution record](https://sources.debian.org/copyright/license/node-buffers/0.1.1-2/)

The copyright record identifies James Halliday and grants MIT permission. Its cited historical upstream commit is no longer reachable, so the official distribution record and exact-source comparison are retained as the evidence. The missing npm declaration is not silently rewritten as an original npm declaration.

## Matched source files

| File | SHA-256 |
|---|---|
| `README.markdown` | `99e8a68c4949c4cbe64b480c8717fb616d1d78ea7715c0e394a5186e6c3a5ace` |
| `examples/slice.js` | `8bff15364cb53bc2c6523dbec1dea1017696eb8b59fdf4c8d7cd31eea3a3750b` |
| `examples/splice.js` | `edf9fc9a0cfab7ed73edfff9a1409e65918b8f2cd34eeef04b3c6a1838ffc1cb` |
| `index.js` | `97801e296ba5f3c32242f647e1daac5917e300367fed7935ab1e62f40adb1b8a` |
| `test/buffers.js` | `9d0d9671bde206620d50e08f9f855fe7898efd74727d4b6f0913650ea252997f` |

The generator rechecks every source hash and the copyright notice hash. A changed version or source requires a new license review. The project retains the original dependency versions because tested unzipper upgrade candidates regressed ExcelJS's streaming reader. Both ordinary XLSX round-trip and streaming read checks are retained.

日本語：npm版に宣言のなかったライセンスは、MIT許諾を明記したDebian公式配布記録と同一ソース5ファイルの照合で確認しました。依存バージョンは維持し、許諾原文・出典・ハッシュを通知資料へ含めます。npmに元から宣言があるものとして扱わず、確認経路を明示しています。
