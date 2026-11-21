import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("PJ編集・保存・全表示・入出力で外部送信を試みない", async ({
  page, context, baseURL,
}, testInfo) => {
  const origin = new URL(baseURL!).origin;
  const marker = "https://example.invalid/ganttdamn-network-fixture";
  const requests: { url: string; method: string; type: string; fixtureInPayload: boolean }[] = [];
  const sockets: string[] = [], frames: string[] = [], external: string[] = [];
  const pageErrors: string[] = [], workers: string[] = [];
  const containsFixture = (value: string) => {
    if (value.includes(marker)) return true;
    try { return decodeURIComponent(value).includes(marker); }
    catch { return false; }
  };
  const isLocal = (value: string) => {
    const url = new URL(value);
    if (url.protocol === "data:" || url.protocol === "blob:") return true;
    if (url.protocol === "ws:" || url.protocol === "wss:")
      url.protocol = url.protocol === "ws:" ? "http:" : "https:";
    return url.origin === origin;
  };
  context.on("request", (request) => {
    requests.push({
      url: request.url(), method: request.method(), type: request.resourceType(),
      fixtureInPayload: containsFixture(request.url()) || containsFixture(request.postData() ?? ""),
    });
  });
  context.on("serviceworker", worker => workers.push(worker.url()));
  page.on("pageerror", error => pageErrors.push(error.message));
  // Record attempted off-origin traffic and abort it before it can leave the test browser.
  await context.route("**/*", route => {
    if (isLocal(route.request().url())) return route.continue();
    external.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  await context.routeWebSocket("**/*", socket => {
    sockets.push(socket.url());
    if (isLocal(socket.url())) {
      const server = socket.connectToServer();
      socket.onMessage(message => {
        frames.push(String(message));
        server.send(message);
      });
    } else {
      external.push(socket.url());
      socket.close();
    }
  });
  await page.clock.setFixedTime(new Date("2027-06-15T10:00:00+09:00"));
  await page.goto("/");
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  const selector = page.getByRole("combobox", { name: "プロジェクトを切り替え", exact: true });
  const originalId = await selector.inputValue();
  await page.locator(".grid-scroll").evaluate(el => { el.scrollLeft = 0; });
  await page.getByTestId("schedule-bar").first().click();
  await page.getByRole("textbox", { name: "バー内テキスト" }).fill(marker);
  await page.getByRole("textbox", { name: "補足テキスト" }).fill("ローカル保存のみの確認用データ");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "＋ 行を追加", exact: true }).first().click();
  await page.getByTestId("cell-7-1").click();
  await page.getByRole("button", { name: "ブルーで塗りつぶす", exact: true }).click();
  await expect(page.getByTestId("schedule-bar")).toHaveCount(8);
  await page.getByTestId("cell-7-4").click();
  await page.getByRole("button", { name: "◆ マイルストーンを追加", exact: true }).click();
  await expect(page.locator(".milestone")).toHaveCount(2);

  await page.getByRole("button", { name: "Damn it", exact: true }).click();
  const bar = page.getByTestId("schedule-bar").nth(1);
  const box = (await bar.boundingBox())!;
  const step = (await page.getByTestId("cell-0-0").boundingBox())!.width;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + step, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(bar).toHaveAttribute("data-start-date", "2027-03-01");
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await page.getByRole("button", { name: "やり直す", exact: true }).click();

  for (const scale of ["1時間", "日", "週", "Q", "月"]) {
    await page.getByRole("button", { name: scale, exact: true }).click();
    await expect(page.getByRole("button", { name: scale, exact: true })).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "日本語", exact: true }).click();

  await page.getByRole("button", { name: "開く", exact: true }).click();
  await page.getByRole("button", { name: "複製", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).click();
  await selector.selectOption("__all__");
  await expect(page.locator(".grid-row")).toHaveCount(16);
  await selector.selectOption("__all_names__");
  await expect(page.locator(".grid-row")).toHaveCount(2);
  await page.getByRole("button", { name: /エクスポート/ }).first().click();
  await expect(page.getByAltText("表示期間の出力プレビュー")).toBeVisible();
  for (const kind of ["PNG", "SVG", "XLSX", "JSON"]) {
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: `${kind} を保存`, exact: true }).click();
    const download = await downloadEvent;
    expect(await download.failure()).toBeNull();
  }
  const backupEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "全データをバックアップ", exact: true }).click();
  const backup = await backupEvent;
  expect(await backup.failure()).toBeNull();
  const data = await readFile((await backup.path())!);
  expect(JSON.parse(data.toString()).projects).toHaveLength(2);
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "network-fixture-backup.json", mimeType: "application/json", buffer: data,
  });
  await expect(page.locator(".grid-row")).toHaveCount(32);
  await selector.selectOption(originalId);
  await expect(page.locator(".grid-row")).toHaveCount(8);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute("title", marker);
  // A defined observation window also catches delayed telemetry after the final action.
  await page.waitForTimeout(2000);

  const summary = {
    project: testInfo.project.name,
    origin,
    httpRequests: requests.length,
    httpMethods: [...new Set(requests.map(r => r.method))],
    requestTypes: [...new Set(requests.map(r => r.type))].sort(),
    nonLocalHttpRequests: requests.filter(r => !isLocal(r.url)).length,
    nonLocalWebSocketAttempts: sockets.filter(url => !isLocal(url)).length,
    externalAttemptsBlocked: external,
    httpRequestsWithFixtureData: requests.filter(r => r.fixtureInPayload).length,
    webSocketFramesWithFixtureData: frames.filter(containsFixture).length,
    localWebSocketFramesSent: frames.length,
    localWebSockets: sockets.filter(isLocal).length,
    serviceWorkers: workers.length,
    pageErrors,
    observationAfterFinalActionMs: 2000,
  };
  await writeFile(testInfo.outputPath("network-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  expect(external).toEqual([]);
  expect(summary.nonLocalHttpRequests).toBe(0);
  expect(summary.httpRequestsWithFixtureData).toBe(0);
  expect(summary.webSocketFramesWithFixtureData).toBe(0);
  expect(requests.every(r => isLocal(r.url) && r.method === "GET")).toBe(true);
  expect(workers).toEqual([]);
  expect(pageErrors).toEqual([]);
});
