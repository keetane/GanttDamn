# Supplemental third-party license material

These files supplement license texts present in installed npm packages.

- `supplemental/fsevents-2.3.2-LICENSE.txt` and `supplemental/fsevents-2.3.3-LICENSE.txt`: exact license files from the corresponding lockfile-verified npm artifacts, https://registry.npmjs.org/fsevents/-/fsevents-2.3.2.tgz and https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz . Both have SHA-256 `2a8a5d6197bb97a018b8a190dd3ed853d750ca87c8e80c17aad41d6c6ff448e1`. They keep notice generation reproducible on Linux, where these macOS-only optional packages are not installed. Installed copies are checked against these texts when present.

- `supplemental/saxes-5.0.1-LICENSE.txt`: exact upstream file, omitted from the npm artifact. Source: https://raw.githubusercontent.com/lddubeau/saxes/v5.0.1/LICENSE . SHA-256: `0fac2374380621b22e6b50451057721a9c52935b02d16d106a9f04897f061d0e`.
- `supplemental/stackback-0.0.2-MIT.txt`: npm author attribution and declared MIT license, with the standard MIT permission/disclaimer. Source declaration: https://github.com/defunctzombie/node-stackback/blob/master/package.json . No copyright year has been inferred.
- [ExcelJS browser notices](exceljs-browser-NOTICES.txt) and [provenance](exceljs-browser-provenance.md): notice texts for upstream code embedded in the official ExcelJS 4.4.0 browser bundle. The bundle's source map has no buffers, binary, chainsaw, or unzipper modules.

The browser bundle also contains JSZip's own browser bundle. Its MIT option applies; the current npm graph supplies notices for its lie, immediate, pako, readable-stream, and associated compatibility helpers. pako's zlib source notice is included separately by the notice generator.

These licenses belong to their respective upstream authors. They are not relicensed under GanttDamn's MIT license. Regenerate `THIRD_PARTY_NOTICES.txt` with `npm run licenses:generate` after changing dependencies. An ExcelJS version/source-map change requires updating the browser notice snapshot as well.

- [buffers source/license verification](buffers-provenance.md): MIT terms from the matching official Debian distribution, with five source-file hashes checked by the generator.
- `supplemental/node-chainsaw-COPYRIGHT.txt`: https://sources.debian.org/data/main/n/node-chainsaw/0.1.0-5/debian/copyright ; SHA-256 `bd34bc03a00662f25c448882c33a467aec2834cb2abe3be410822af63fb5f803`.
- `supplemental/binary-0.3.0-MIT.txt`: npm author attribution and explicit MIT declaration with the standard MIT permission/disclaimer; no copyright year inferred.
