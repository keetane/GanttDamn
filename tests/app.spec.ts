import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
});
test("範囲選択・再塗りつぶし・バー編集・伸縮・履歴・リロード", async ({
  page,
}) => {
  await page.getByRole("button", { name: "＋ 新規作成", exact: true }).click();
  await page.getByPlaceholder("例：2027年 プロジェクト計画").fill("操作テスト");
  await page.getByRole("button", { name: "作成する" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("cell-0-1")).toBeVisible();
  const start = page.getByTestId("cell-0-1"),
    end = page.getByTestId("cell-0-4");
  const a = (await start.boundingBox())!,
    b = (await end.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.getByRole("button", { name: "ブルーで塗りつぶす" }).click();
  await expect(page.getByTestId("schedule-bar")).toHaveCount(1);
  await page.getByTestId("schedule-bar").click();
  await page
    .getByRole("textbox", { name: "バー内テキスト" })
    .fill("テストバー");
  await expect(page.getByText("テストバー", { exact: true })).toBeVisible();
  const handle = page.getByTestId("resize-end"),
    h = (await handle.boundingBox())!;
  await page.mouse.move(h.x + 3, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + 90, h.y + h.height / 2, { steps: 8 });
  await page.mouse.up();
  await page
    .getByRole("textbox", { name: "項目名", exact: true })
    .fill("編集した行");
  await page
    .getByRole("button", { name: "＋ 行を追加", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("cell-1-0")).toBeVisible();
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.getByTestId("cell-1-0")).toHaveCount(0);
  await page.getByRole("button", { name: "やり直す", exact: true }).click();
  await expect(page.getByTestId("cell-1-0")).toBeVisible();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("編集した行", { exact: true })).toBeVisible();
  await expect(page.getByText("テストバー", { exact: true })).toBeVisible();
});
for (const scale of ["Day", "Week", "Month", "Quarter"])
  test(`${scale}新規作成`, async ({ page }) => {
    await page
      .getByRole("button", { name: "＋ 新規作成", exact: true })
      .click();
    await page.getByRole("button", { name: new RegExp(`^${scale}`) }).click();
    await page.getByRole("button", { name: "作成する" }).click();
    await expect(
      page.getByText(new RegExp(`· ${scale.toUpperCase()}$`)),
    ).toBeVisible();
  });
test("出力プレビューとPNG/SVG/XLSX/JSONダウンロード", async ({ page }) => {
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  await expect(page.getByAltText("表示期間の出力プレビュー")).toBeVisible();
  for (const kind of ["PNG", "SVG", "XLSX", "JSON"]) {
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: `${kind} を保存` }).click();
    const download = await event;
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`\\.${kind.toLowerCase()}$`),
    );
    expect(await download.failure()).toBeNull();
    const data = await readFile((await download.path())!);
    if (kind === "PNG") {
      expect(data.readUInt32BE(16)).toBe(2980);
      expect(data.readUInt32BE(20)).toBe(1132);
    }
    if (kind === "SVG") {
      expect(data.toString()).toContain("12月");
      expect(data.toString()).toContain("運用・グロース");
    }
  }
});
test("Excel形式の複数行貼り付けと直接編集", async ({ page }) => {
  await page.getByTestId("cell-0-0").click({ force: true });
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "貼付項目1\t補足1\n貼付項目2\t補足2");
    window.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true }),
    );
  });
  await expect(page.getByText("貼付項目1", { exact: true })).toBeVisible();
  await page.getByText("貼付項目1", { exact: true }).dblclick();
  const input = page.getByRole("textbox", { name: "行1の項目名", exact: true });
  await input.fill("直接編集");
  await input.press("Enter");
  await expect(page.getByText("直接編集", { exact: true })).toBeVisible();
});
test("Shiftドラッグでバーの中を部分消去・別のバーの作成", async ({ page }) => {
  const bar = page.getByTestId("schedule-bar").nth(3);
  const r = (await bar.boundingBox())!;
  await page.mouse.move(r.x + 88 + 30, r.y + r.height / 2);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.move(r.x + 2 * 88 + 30, r.y + r.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page
    .getByRole("button", { name: "塗りつぶしを解除", exact: true })
    .click();
  await expect(page.getByTestId("schedule-bar")).toHaveCount(8);
  const cell = page.getByTestId("cell-3-1");
  await cell.click();
  await page.getByRole("button", { name: "オレンジで塗りつぶす" }).click();
  await expect(page.getByTestId("schedule-bar")).toHaveCount(9);
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.getByTestId("schedule-bar")).toHaveCount(8);
});
test("行の移動・複製・空行挿入・削除と固定列", async ({ page }) => {
  await page.getByText("要件定義", { exact: true }).click();
  await page.getByRole("button", { name: "上へ移動", exact: true }).click();
  await expect(page.locator(".row-title .editable").first()).toHaveText(
    "要件定義",
  );
  await page.getByRole("button", { name: "行を複製", exact: true }).click();
  await expect(
    page.getByText("要件定義 のコピー", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "空行を挿入", exact: true }).click();
  await expect(page.locator(".grid-row")).toHaveCount(9);
  await page.getByRole("button", { name: "行を削除", exact: true }).click();
  await expect(page.locator(".grid-row")).toHaveCount(8);
  const before = await page.locator(".row-title").first().boundingBox();
  await page.locator(".grid-scroll").evaluate((el) => (el.scrollLeft = 500));
  const after = await page.locator(".row-title").first().boundingBox();
  expect(after!.x).toBe(before!.x);
});
test("JSON復元・不正JSON拒否・チャート一覧と最後のチャート復元", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON を保存" }).click();
  const saved = await event;
  const path = (await saved.path())!;
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page.getByRole("button", { name: "開く", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(path);
  await expect(page.getByText("JSONからチャートを復元しました")).toBeVisible();
  await page
    .getByRole("textbox", { name: "チャートタイトル", exact: true })
    .fill("復元チャート");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "このブラウザに保存しました",
  );
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "チャートタイトル", exact: true }),
  ).toHaveValue("復元チャート");
  await page.getByRole("button", { name: "開く", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":100}'),
  });
  await expect(page.getByText(/JSONの形式が正しくありません/)).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "チャートタイトル", exact: true }),
  ).toHaveValue("復元チャート");
  expect(errors).toEqual([]);
});
test("サンプル画面の表示確認", async ({ page }) => {
  await page.screenshot({
    path: "test-results/timeline-grid.png",
    fullPage: true,
  });
  expect(
    await page
      .locator(".app-shell")
      .evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
test("日付線ボタン・タイトルと列名の編集・milestone結合・行ドラッグ", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-01-15T12:00:00+09:00"));
  await page.reload();
  await expect(page.getByTestId("today-marker")).toBeVisible();
  await expect(page.getByTestId("today-marker")).toHaveText("");
  const toggle = page.getByRole("button", { name: "日付線", exact: true });
  await toggle.click();
  await expect(page.getByTestId("today-marker")).toHaveCount(0);
  await toggle.click();
  await expect(page.getByTestId("today-marker")).toBeVisible();
  await page
    .getByRole("textbox", { name: "プロジェクトタイトル", exact: true })
    .fill("新しいプロジェクト");
  await expect(
    page.getByRole("textbox", { name: "チャートタイトル", exact: true }),
  ).toHaveValue("新しいプロジェクト");
  await page
    .getByLabel("milestone列の見出し: milestone", { exact: true })
    .dblclick();
  const title = page.getByRole("textbox", {
    name: "milestone列の見出し",
    exact: true,
  });
  await title.fill("工程");
  await title.press("Enter");
  await page
    .getByLabel("action item列の見出し: action item", { exact: true })
    .dblclick();
  const note = page.getByRole("textbox", {
    name: "action item列の見出し",
    exact: true,
  });
  await note.fill("作業");
  await note.press("Enter");
  await page.getByText("要件定義", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "項目名", exact: true })
    .fill("リサーチ・企画");
  const merged = page.locator(".row-title[data-merged-start]");
  await expect(merged).toHaveCount(1);
  expect((await merged.boundingBox())!.height).toBe(108);
  await expect(page.locator(".row-note .editable")).toHaveCount(7);
  await page
    .getByLabel("行7を移動", { exact: true })
    .dragTo(page.locator(".grid-row").first());
  await expect(page.locator(".row-title .editable").first()).toHaveText(
    "運用・グロース",
  );
  await page.screenshot({
    path: "test-results/grouped-grid.png",
    fullPage: true,
  });
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "プロジェクトタイトル", exact: true }),
  ).toHaveValue("新しいプロジェクト");
  await expect(
    page.getByLabel("milestone列の見出し: 工程", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".row-title[data-merged-start]")).toHaveCount(1);
});
test("1時間・日・週・月・Qの切替、稼働設定とプロジェクト管理", async ({
  page,
}) => {
  await page.clock.setFixedTime(await page.evaluate(() => new Date().setHours(7, 0, 0, 0)));
  await expect(
    page.getByText("アイデアから、その先の一歩まで。", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "プロジェクト管理", exact: true })
    .click();
  await page
    .getByRole("button", { name: "＋ プロジェクトを作成", exact: true })
    .click();
  await page
    .getByPlaceholder("例：2027年 プロジェクト計画")
    .fill("時間プロジェクト");
  await page.getByRole("button", { name: /^Hour/ }).click();
  await page.getByRole("button", { name: "作成する", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".period-header>div").first()).toHaveText("8:00");
  await page.getByTestId("cell-0-0").click();
  await page
    .getByRole("button", { name: "ブルーで塗りつぶす", exact: true })
    .click();
  for (const scale of ["日", "週", "月", "Q", "1時間"]) {
    await page.getByRole("button", { name: scale, exact: true }).click();
    await expect(
      page.getByRole("button", { name: scale, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("schedule-bar")).toHaveCount(1);
  }
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "稼働開始", exact: true }),
  ).toHaveValue("8");
  await expect(
    page.getByRole("combobox", { name: "稼働終了", exact: true }),
  ).toHaveValue("18");
  await expect(
    page.getByRole("checkbox", { name: "月曜日", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "日曜日", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("combobox", { name: "稼働終了", exact: true })
    .selectOption("17");
  await page.getByRole("checkbox", { name: "土曜日", exact: true }).check();
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page
    .getByRole("combobox", { name: "プロジェクトを切り替え", exact: true })
    .selectOption({ label: "新サービス ローンチロードマップ" });
  await expect(page.getByTestId("schedule-bar")).toHaveCount(7);
  await page
    .getByRole("combobox", { name: "プロジェクトを切り替え", exact: true })
    .selectOption({ label: "時間プロジェクト" });
  await expect(page.getByTestId("schedule-bar")).toHaveCount(1);
  await expect(page.locator(".period-header>div").first()).toHaveText("8:00");
  await page
    .getByRole("button", { name: "プロジェクト管理", exact: true })
    .click();
  const current = page.locator(".library-item.current");
  await current.getByRole("button", { name: "名前変更", exact: true }).click();
  await page
    .getByRole("textbox", { name: "新しいプロジェクト名", exact: true })
    .fill("変更した時間プロジェクト");
  await page.getByRole("button", { name: "変更する", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "新しいプロジェクト名", exact: true }),
  ).toHaveCount(0);
  await current.getByRole("button", { name: "複製", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(3);
  const copy = page
    .locator(".library-item")
    .filter({ hasText: "変更した時間プロジェクト のコピー" });
  await copy.getByRole("button", { name: "削除", exact: true }).click();
  await copy.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "プロジェクトタイトル", exact: true }),
  ).toHaveValue("変更した時間プロジェクト");
  await expect(
    page.getByRole("button", { name: "1時間", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "test-results/hour-project.png",
    fullPage: true,
  });
});
test("今日へボタンで横スクロール・範囲外移動・日付線の再表示", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-11-15T10:30:00+09:00"));
  await page.reload();
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "日付線", exact: true }).click();
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "日付線", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const scroll = page.locator(".grid-scroll");
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  const marker = (await page.getByTestId("today-marker").boundingBox())!,
    viewport = (await scroll.boundingBox())!;
  expect(marker.x).toBeGreaterThan(viewport.x + 370);
  expect(marker.x).toBeLessThan(viewport.x + viewport.width);
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await page.getByLabel("PJ開始日", { exact: true }).fill("2020-01-01");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await expect(page.getByTestId("today-marker")).toHaveCount(0);
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("PJ期間外");
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByLabel("PJ開始日", { exact: true })).toHaveValue(
    "2020-01-01",
  );
  await page.getByLabel("PJ開始日", { exact: true }).fill("2027-01-01");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page.getByRole("button", { name: "1時間", exact: true }).click();
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByTestId("today-marker")).toBeVisible();
  await page.clock.setFixedTime(new Date("2027-11-14T10:30:00+09:00"));
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("次の稼働開始");
});
test("PJ全期間の横スクロールと画面グリッド数、終了日を保存", async ({
  page,
}) => {
  const grid = page.locator(".grid-scroll");
  const first = page.getByTestId("cell-0-0");
  const bounds = (await grid.boundingBox())!,
    cell = (await first.boundingBox())!;
  expect(cell.width).toBeCloseTo((bounds.width - 370) / 12, 0);
  await grid.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await expect(page.getByTestId("cell-0-35")).toBeVisible();
  await expect(page.getByTestId("cell-0-0")).toHaveCount(0);
  await page.getByTestId("cell-0-35").click();
  await page
    .getByRole("button", { name: "レッドで塗りつぶす", exact: true })
    .click();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "このブラウザに保存しました",
  );
  const bars = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("timeline-grid", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return await new Promise<
      { startDate: string; endDateExclusive: string; color: string }[]
    >((resolve, reject) => {
      const r = db.transaction("charts").objectStore("charts").getAll();
      r.onsuccess = () => {
        db.close();
        resolve(r.result[0].rows[0].bars);
      };
      r.onerror = () => reject(r.error);
    });
  });
  expect(bars.find((b) => b.color === "#477de0")?.endDateExclusive).toBe(
    "2027-03-01",
  );
  expect(bars.find((b) => b.color === "#dc6770")?.startDate).toBe("2029-12-01");
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByLabel("PJ開始日", { exact: true })).toHaveValue(
    "2027-01-01",
  );
  await expect(page.getByLabel("PJ終了日", { exact: true })).toHaveValue("");
  await page.getByLabel("表示期間", { exact: true }).fill("6");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await grid.evaluate((el) => (el.scrollLeft = 0));
  await expect(page.getByTestId("cell-0-0")).toBeVisible();
  expect((await page.getByTestId("cell-0-0").boundingBox())!.width).toBeCloseTo(
    cell.width * 2,
    0,
  );
  expect(
    (await page.getByTestId("schedule-bar").first().boundingBox())!.width,
  ).toBeCloseTo(cell.width * 4, 0);
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await page.getByLabel("PJ終了日", { exact: true }).fill("2028-12-31");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await grid.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await expect(page.getByTestId("cell-0-23")).toBeVisible();
  await expect(page.getByTestId("cell-0-24")).toHaveCount(0);
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByLabel("PJ終了日", { exact: true })).toHaveValue(
    "2028-12-31",
  );
  await expect(page.getByLabel("表示期間", { exact: true })).toHaveValue("6");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page.screenshot({
    path: "test-results/project-range.png",
    fullPage: true,
  });
});
test("表示期間だけの出力と、1時間の日付線の位置・固定列クリップ", async ({
  page,
}) => {
  const grid = page.locator(".grid-scroll");
  await grid.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await expect(page.getByTestId("cell-0-35")).toBeVisible();
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  await expect(page.getByTestId("export-range")).toContainText("2029-01-01");
  await expect(page.getByTestId("export-range")).toContainText("2030-01-01");
  for (const kind of ["SVG", "XLSX", "JSON"]) {
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `${kind} を保存`, exact: true })
      .click();
    const file = await event;
    const bytes = await readFile((await file.path())!);
    if (kind === "SVG") {
      expect(bytes.toString()).toContain("2029");
      expect(bytes.toString()).not.toContain("2027");
      expect(bytes.toString()).not.toContain("アイデアをかたちに");
    }
    if (kind === "JSON") {
      const data = JSON.parse(bytes.toString());
      expect(data.visibleStartDate).toBe("2029-01-01");
      expect(
        data.rows.flatMap((r: { bars: unknown[] }) => r.bars),
      ).toHaveLength(0);
    }
  }
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page.clock.install({ time: new Date("2027-01-01T09:30:00+09:00") });
  await page.getByRole("button", { name: "1時間", exact: true }).click();
  await expect(page.getByTestId("today-marker")).toBeVisible();
  const first = (await page.getByTestId("cell-0-0").boundingBox())!,
    marker = (await page.getByTestId("today-marker").boundingBox())!;
  expect(marker.x + 1 - first.x).toBeCloseTo(first.width * 1.5, 0);
  await grid.evaluate(
    (el) => (el.scrollLeft = (5 * (el.clientWidth - 370)) / 12),
  );
  await expect
    .poll(async () => await grid.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  const clip = await page
    .locator(".timeline-row")
    .first()
    .evaluate((el) => getComputedStyle(el).clipPath);
  expect(clip).not.toBe("none");
  await expect
    .poll(async () =>
      page
        .locator(".timeline-row")
        .first()
        .evaluate((el) => getComputedStyle(el).clipPath),
    )
    .not.toBe("inset(0px)");
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByTestId("today-marker")).toBeVisible();
  await page.clock.runFor(60000);
  await expect
    .poll(async () => {
      const line = (await page.getByTestId("today-marker").boundingBox())!;
      return line.x;
    })
    .toBeGreaterThan(marker.x);
});
test("日15・時間12の初期値と曜日、月別に区切った週を表示", async ({ page }) => {
  await page.getByRole("button", { name: "日", exact: true }).click();
  await expect(page.locator(".period-header>div").first()).toHaveText(
    "1/1(金)",
  );
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByLabel("表示期間", { exact: true })).toHaveValue("15");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page.getByRole("button", { name: "1時間", exact: true }).click();
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await expect(page.getByLabel("表示期間", { exact: true })).toHaveValue("12");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await page.getByRole("button", { name: "週", exact: true }).click();
  await expect(page.locator(".year-header")).toContainText("2027年1月");
  await expect(page.locator(".period-header>div").first()).toHaveText("1〜3日");
  await expect(page.locator(".period-header>div").nth(5)).toHaveText("1〜7日");
  await page.screenshot({
    path: "test-results/monthly-weeks.png",
    fullPage: true,
  });
});
test("営業時間外は次の稼働開始へジャンプし、月またぎ週は月末側へまとめる", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-11-12T18:00:00+09:00"));
  await page.getByRole("button", { name: "1時間", exact: true }).click();
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("2027-11-15 08:00");
  await expect(
    page.locator('.period-header>div[title^="2027-11-15T08:00"]'),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date("2027-11-14T12:00:00+09:00"));
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("2027-11-15 08:00");
  await page.clock.setFixedTime(new Date("2027-11-15T07:00:00+09:00"));
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("2027-11-15 08:00");
  await page.getByRole("button", { name: "週", exact: true }).click();
  await page.getByRole("button", { name: "⚙ 表示設定", exact: true }).click();
  await page.getByLabel("PJ開始日", { exact: true }).fill("2027-04-26");
  await page.getByRole("button", { name: "完了", exact: true }).click();
  await expect(page.locator(".period-header>div").first()).toHaveText(
    "4/26〜5/2",
  );
  await expect(page.locator(".period-header>div").nth(1)).toHaveText("3〜9日");
  await expect(page.locator(".year-header>div").first()).toHaveText(
    "2027年4月",
  );
  await expect(page.locator(".year-header>div").nth(1)).toHaveText("2027年5月");
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG を保存", exact: true }).click();
  const file = await event;
  const svg = (await readFile((await file.path())!)).toString();
  expect(svg).toContain("4/26〜5/2");
  expect(svg).not.toContain("1〜2日");
});
test("Damn itモードで以降の全行のバーをまとめて移動しUndo・取消ができる", async ({
  page,
}) => {
  const mode = page.getByRole("button", { name: "Damn it", exact: true });
  await expect(mode).toHaveAttribute("aria-pressed", "false");
  await mode.click();
  await expect(mode).toHaveAttribute("aria-pressed", "true");
  const bar = page.getByTestId("schedule-bar").nth(1),
    id = (await bar.getAttribute("data-bar-id"))!,
    r = (await bar.boundingBox())!,
    step = (await page.getByTestId("cell-0-0").boundingBox())!.width;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 + step, r.y + r.height / 2, {
    steps: 8,
  });
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await page.mouse.up();
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute(
    "data-start-date",
    "2027-01-01",
  );
  await expect(page.getByTestId("schedule-bar").nth(2)).toHaveAttribute(
    "data-start-date",
    "2027-04-01",
  );
  await expect(page.getByTestId("schedule-bar").last()).toHaveAttribute(
    "data-start-date",
    "2028-01-01",
  );
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-02-01",
  );
  await page.getByRole("button", { name: "やり直す", exact: true }).click();
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  const moved = (await page.locator(`[data-bar-id="${id}"]`).boundingBox())!;
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    moved.x + moved.width / 2 + step,
    moved.y + moved.height / 2,
    { steps: 8 },
  );
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  const edge = page.getByTestId("resize-end").first(),
    e = (await edge.boundingBox())!;
  await page.mouse.move(e.x + 3, e.y + e.height / 2);
  await page.mouse.down();
  await page.mouse.move(e.x + 3 + step, e.y + e.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute(
    "data-end-date",
    "2027-04-01",
  );
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(`[data-bar-id="${id}"]`)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await expect(mode).toHaveAttribute("aria-pressed", "false");
});
test("非稼働時間の日付線は次の稼働開始と一致し、プレビューにも反映", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-01-01T18:00:00+09:00"));
  await page.getByRole("button", { name: "1時間", exact: true }).click();
  await page.getByRole("button", { name: "今日へ", exact: true }).click();
  const marker = (await page.getByTestId("today-marker").boundingBox())!,
    grid = (await page.locator(".grid-scroll").boundingBox())!;
  expect(marker.x).toBeGreaterThan(grid.x + 370);
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG を保存", exact: true }).click();
  const file = await event;
  expect((await readFile((await file.path())!)).toString()).toContain(
    'data-today="2027-01-04T08:00"',
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page.clock.setFixedTime(new Date("2027-01-02T12:00:00+09:00"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("today-marker")).toBeVisible();
  expect((await page.getByTestId("today-marker").boundingBox())!.x).toBeCloseTo(
    marker.x,
    0,
  );
});
test("allで全PJを表示し、Damn itの対象を表示中のPJに限定・全PJへ拡張", async ({
  page,
}) => {
  const chooser = page.getByRole("combobox", {
    name: "プロジェクトを切り替え",
    exact: true,
  });
  const sampleId = await chooser.inputValue();
  await page.getByRole("button", { name: "＋ 新規作成", exact: true }).click();
  await page.getByPlaceholder("例：2027年 プロジェクト計画").fill("Project B");
  await page.getByLabel("PJ開始日", { exact: true }).fill("2027-01-01");
  await page.getByRole("button", { name: "作成する", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const bId = await chooser.inputValue();
  await page.getByTestId("cell-0-1").click();
  await page
    .getByRole("button", { name: "ブルーで塗りつぶす", exact: true })
    .click();
  await chooser.selectOption(sampleId);
  await expect(page.getByTestId("schedule-bar")).toHaveCount(7);
  await page.getByRole("button", { name: "Damn it", exact: true }).click();
  const drag = async (bar: import("@playwright/test").Locator) => {
    const r = (await bar.boundingBox())!,
      step = (await page.locator(".grid-cell").first().boundingBox())!.width;
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width / 2 + step, r.y + r.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
  };
  await drag(page.getByTestId("schedule-bar").nth(1));
  await expect(page.getByTestId("schedule-bar").nth(1)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await chooser.selectOption(bId);
  await expect(page.getByTestId("schedule-bar")).toHaveCount(1);
  await expect(page.getByTestId("schedule-bar")).toHaveAttribute(
    "data-start-date",
    "2027-02-01",
  );
  await chooser.selectOption("__all__");
  await expect(page.locator(".grid-row")).toHaveCount(8);
  const bBar = page.locator(
      `[data-project-id="${bId}"] [data-testid="schedule-bar"]`,
    ),
    sampleBars = page.locator(
      `[data-project-id="${sampleId}"] [data-testid="schedule-bar"]`,
    );
  await drag(bBar);
  await expect(bBar).toHaveAttribute("data-start-date", "2027-03-01");
  await expect(sampleBars.nth(1)).toHaveAttribute(
    "data-start-date",
    "2027-04-01",
  );
  await expect(sampleBars.first()).toHaveAttribute(
    "data-start-date",
    "2027-01-01",
  );
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(bBar).toHaveAttribute("data-start-date", "2027-02-01");
  await expect(sampleBars.nth(1)).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await page.getByRole("button", { name: "やり直す", exact: true }).click();
  await expect(bBar).toHaveAttribute("data-start-date", "2027-03-01");
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(chooser).toHaveValue("__all__");
  await expect(bBar).toHaveAttribute("data-start-date", "2027-03-01");
  await chooser.selectOption(bId);
  await expect(page.getByTestId("schedule-bar")).toHaveAttribute(
    "data-start-date",
    "2027-03-01",
  );
  await chooser.selectOption("__all__");
  await page.screenshot({
    path: "test-results/all-projects.png",
    fullPage: true,
  });
});
test("日英のUI切替を保存し、PJ名や保存データを変えない", async ({ page }) => {
  const title = await page
    .getByRole("textbox", { name: "プロジェクトタイトル", exact: true })
    .inputValue();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Manage projects", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Today", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Project title", exact: true }),
  ).toHaveValue(title);
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".period-header")).toContainText("(Fri)");
  await page
    .getByRole("button", { name: "⚙ View settings", exact: true })
    .click();
  await expect(page.getByLabel("Visible periods", { exact: true })).toHaveValue(
    "15",
  );
  await expect(
    page.getByRole("checkbox", { name: "Mon", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Manage projects", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/english.png", fullPage: true });
  await page.getByRole("button", { name: "日本語", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "プロジェクト管理", exact: true }),
  ).toBeVisible();
});
test("allの管理変更と複数PJバックアップを復元して保持", async ({ page }) => {
  const chooser = page.getByRole("combobox", {
    name: "プロジェクトを切り替え",
    exact: true,
  });
  await chooser.selectOption("__all__");
  await page
    .getByRole("button", { name: "プロジェクト管理", exact: true })
    .click();
  await page.getByRole("button", { name: "複製", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  const copy = page.locator(".library-item").filter({ hasText: "のコピー" });
  await copy.getByRole("button", { name: "名前変更", exact: true }).click();
  await page
    .getByRole("textbox", { name: "新しいプロジェクト名", exact: true })
    .fill("Renamed overview project");
  await page.getByRole("button", { name: "変更する", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Renamed overview project", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await expect(page.locator(".grid-row")).toHaveCount(14);
  await page
    .getByRole("button", { name: "エクスポート", exact: false })
    .first()
    .click();
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "全データをバックアップ", exact: true })
    .click();
  const backup = await event,
    path = (await backup.path())!;
  const data = JSON.parse((await readFile(path)).toString());
  expect(data.projects).toHaveLength(2);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page.getByRole("button", { name: "開く", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(path);
  await expect(page.locator(".grid-row")).toHaveCount(28);
  await page
    .getByRole("button", { name: "プロジェクト管理", exact: true })
    .click();
  await page
    .locator(".library-item")
    .last()
    .getByRole("button", { name: "削除", exact: true })
    .click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(3);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await expect(page.locator(".grid-row")).toHaveCount(21);
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".grid-row")).toHaveCount(21);
});
test("単位切替で日付線を先頭グリッドへ配置し、緑基調で説明を表示しない", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-11-15T10:30:00+09:00"));
  for (const scale of ["日", "週", "月", "Q", "1時間"]) {
    await page.getByRole("button", { name: scale, exact: true }).click();
    const viewport = (await page.locator(".grid-scroll").boundingBox())!,
      line = (await page.getByTestId("today-marker").boundingBox())!,
      count = scale === "日" ? 15 : scale === "Q" ? 8 : 12,
      width = (viewport.width - 370) / count;
    expect(line.x + 1).toBeGreaterThanOrEqual(viewport.x + 370 - 1);
    expect(line.x + 1).toBeLessThan(viewport.x + 370 + width + 1);
  }
  await expect(
    page.getByText("YOUR PLANS, AT A GLANCE", { exact: true }),
  ).toHaveCount(0);
  const color = await page
    .locator(".brand-mark")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(color).toBe("rgb(35, 95, 73)");
});
test("allの結合milestoneではPJ名を一度だけ表示し、PJ境界を1本の黒線にする", async ({
  page,
}) => {
  await page.getByText("要件定義", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "項目名", exact: true })
    .fill("リサーチ・企画");
  await page.getByRole("button", { name: "開く", exact: true }).click();
  await page.getByRole("button", { name: "複製", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "プロジェクトを切り替え", exact: true })
    .selectOption("__all__");
  await expect(page.locator(".row-title[data-merged-start]")).toHaveCount(2);
  await expect(
    page.locator(".row-title.merged-title .overview-project-name"),
  ).toHaveCount(2);
  await expect(page.locator("[data-project-start]")).toHaveCount(2);
  await expect(page.locator("[data-project-end]")).toHaveCount(1);
  expect(await page.locator(".grid-row").last().evaluate(el => getComputedStyle(el, "::after").content)).toBe("none");
  const border = await page
    .locator("[data-project-end]")
    .last()
    .evaluate((el) => getComputedStyle(el, "::after").height);
  expect(border).toBe("1px");
  expect(await page.locator("[data-project-end]").first().evaluate(el => getComputedStyle(el, "::after").backgroundColor)).toBe("rgb(0, 0, 0)");
  expect(await page.locator("[data-project-start]").last().evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none");
  await expect(page.locator(".overview-notice")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/green-all-merged.png",
    fullPage: true,
  });
});
test("セル・項目・バー・ダイヤモンドは再クリックで選択解除", async ({ page }) => {
  const cell = page.getByTestId("cell-0-0");
  await cell.click({ force: true });
  await expect(cell).toHaveClass(/cell-selected/);
  await cell.click({ force: true });
  await expect(page.locator(".cell-selected")).toHaveCount(0);
  const item = page.locator(".row-note .editable").first();
  await item.click();
  await expect(page.locator(".row-active")).toHaveCount(1);
  await item.click();
  await expect(page.locator(".row-active")).toHaveCount(0);
  const bar = page.getByTestId("schedule-bar").first();
  await bar.click();
  await expect(bar).toHaveClass(/bar-selected/);
  await bar.click();
  await expect(page.locator(".bar-selected")).toHaveCount(0);
  const milestone = page.locator(".milestone").first();
  await milestone.click();
  await expect(milestone).toHaveClass(/milestone-selected/);
  await milestone.click();
  await expect(page.locator(".milestone-selected")).toHaveCount(0);
  await expect(page.locator(".row-active")).toHaveCount(0);
});
test("all project nameはPJごとに1行・1本のバーとダイヤモンドを表示し、移動と復元ができる", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.getByRole("button", { name: "開く", exact: true }).click();
  await page.getByRole("button", { name: "複製", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page.getByRole("dialog").getByRole("button", { name: "閉じる", exact: true }).click();
  const selector = page.getByRole("combobox", { name: "プロジェクトを切り替え", exact: true });
  await selector.selectOption("__all_names__");
  await expect(page.locator(".project-name-view")).toBeVisible();
  await expect(page.locator(".row-note")).toHaveCount(0);
  await expect(page.locator(".row-title .editable")).toHaveCount(2);
  await expect(page.getByText("リサーチ・企画", { exact: true })).toHaveCount(0);
  await expect(page.locator(".grid-row")).toHaveCount(2);
  await expect(page.locator("[data-project-end]")).toHaveCount(0);
  expect(await page.locator(".grid-row").first().evaluate(el => getComputedStyle(el, "::after").content)).toBe("none");
  await expect(page.getByTestId("schedule-bar")).toHaveCount(2);
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute("data-start-date", "2027-01-01");
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute("data-end-date", "2028-01-01");
  await expect(page.locator(".milestone")).toHaveCount(2);
  await page.screenshot({ path: "test-results/all-project-name.png", fullPage: true });
  await page.reload();
  await expect(selector).toHaveValue("__all_names__");
  await expect(page.locator(".row-title .editable")).toHaveCount(2);
  await page.getByRole("button", { name: "Damn it", exact: true }).click();
  const bar = page.getByTestId("schedule-bar").first();
  await bar.click();
  const box = (await bar.boundingBox())!, step = (await page.locator(".grid-cell").first().boundingBox())!.width;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + step, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(bar).toHaveAttribute("data-start-date", "2027-02-01");
  await expect(page.getByTestId("schedule-bar").nth(1)).toHaveAttribute("data-start-date", "2027-02-01");
  await expect(page.getByText("保存済み", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<string[]>((resolve, reject) => {
    const request = indexedDB.open("timeline-grid", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, read = db.transaction("charts").objectStore("charts").getAll();
      read.onsuccess = () => { resolve(read.result.map(c => c.rows[0].bars[0].startDate)); db.close(); };
    };
  }))).toEqual(["2027-02-01", "2027-02-01"]);
  await page.reload();
  await expect(page.getByTestId("schedule-bar").first()).toHaveAttribute("data-start-date", "2027-02-01");
  // After reload the source data still retains all seven schedules per PJ.
  await selector.selectOption("__all__");
  await expect(page.getByTestId("schedule-bar")).toHaveCount(14);
  await expect(page.getByTitle("要件の整理", { exact: true }).first()).toHaveAttribute("data-start-date", "2027-03-01");
  await selector.selectOption("__all_names__");
  await expect(page.getByTestId("schedule-bar")).toHaveCount(2);
  await page.getByRole("button", { name: "Damn it", exact: true }).click();
  const movedBox = (await bar.boundingBox())!;
  await page.mouse.move(movedBox.x + movedBox.width / 2, movedBox.y + movedBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(movedBox.x + movedBox.width / 2 - step, movedBox.y + movedBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(bar).toHaveAttribute("data-start-date", "2027-01-01");
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(bar).toHaveAttribute("data-start-date", "2027-02-01");
  await selector.selectOption("__all__");
  await expect(page.locator(".row-note")).toHaveCount(14);
  await expect(page.getByText("リサーチ・企画", { exact: true })).toHaveCount(2);
  await expect(page.getByTestId("schedule-bar")).toHaveCount(14);
  expect(errors).toEqual([]);
});
test("タイトル・PJ選択・操作を2段のツールバーへ整理", async ({ page }) => {
  const top = page.locator(".topbar"), tools = page.locator(".toolbar");
  await expect(top.getByRole("textbox", { name: "チャートタイトル", exact: true })).toBeVisible();
  await expect(top.getByRole("combobox", { name: "プロジェクトを切り替え", exact: true })).toBeVisible();
  await expect(tools.getByRole("button", { name: "月", exact: true })).toBeVisible();
  const first = (await top.boundingBox())!, second = (await tools.boundingBox())!, workspace = (await page.locator(".workspace").boundingBox())!;
  expect(second.y).toBeCloseTo(first.y + first.height, 0);
  expect(workspace.y).toBeCloseTo(second.y + second.height, 0);
  for (const row of [top,tools]) expect(await row.evaluate(el=>el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: "test-results/two-toolbars.png", fullPage: true });
});

test("通常ドラッグでバーとマイルストーンを単独移動して保存", async ({page}) => {
  const bars = page.getByTestId("schedule-bar");
  const first = bars.first();
  const later = await bars.nth(1).getAttribute("data-start-date");
  const dragOne = async (target: import("@playwright/test").Locator, delta = 1) => {
    const box = (await target.boundingBox())!;
    const width = (await page.locator(".grid-cell").first().boundingBox())!.width;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + width * delta, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
  };
  await dragOne(first);
  await expect(first).toHaveAttribute("data-start-date", "2027-02-01");
  await expect(bars.nth(1)).toHaveAttribute("data-start-date", later!);
  const marker = page.locator(".milestone").first();
  const before = (await marker.boundingBox())!.x;
  await dragOne(marker, -1);
  await expect.poll(async () => (await marker.boundingBox())!.x).toBeLessThan(before - 10);
  await expect(marker).toHaveAttribute("data-date", "2027-11-01");
  await page.getByRole("button", {name:"元に戻す",exact:true}).click();
  await expect(marker).toHaveAttribute("data-date", "2027-12-01");
  await expect(first).toHaveAttribute("data-start-date", "2027-02-01");
  await page.getByRole("button", {name:"やり直す",exact:true}).click();
  await expect(marker).toHaveAttribute("data-date", "2027-11-01");
  await page.getByRole("button", {name: "保存", exact:true}).click();
  await expect(page.getByText("保存済み", {exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByText("保存済み", {exact:true})).toBeVisible();
  await expect(first).toHaveAttribute("data-start-date", "2027-02-01");
  await expect(marker).toHaveAttribute("data-date", "2027-11-01");
});
