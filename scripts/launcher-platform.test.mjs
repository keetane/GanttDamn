import { test } from "node:test";
import assert from "node:assert/strict";
import { browserCommand } from "./launcher-platform.mjs";
test("macOS and Ubuntu use native browser openers with argument arrays", () => {
  const url = "http://127.0.0.1:4317/";
  assert.deepEqual(browserCommand("darwin", url), ["/usr/bin/open", [url]]);
  assert.deepEqual(browserCommand("linux", url), ["xdg-open", [url]]);
  assert.equal(browserCommand("other", url), null);
});
