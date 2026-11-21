import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { createChart } from "../domain/model";
import { saveChart, listCharts, saveLast, readLast, deleteChart } from "./db";
it("IndexedDBで複数チャート・更新・最後のチャート・削除を保持", async () => {
  const a = createChart(),
    b = createChart("week");
  await saveChart(a);
  await saveChart(b);
  a.title = "保存した編集";
  await saveChart(a);
  await saveLast(a.id);
  expect((await listCharts()).find((c) => c.id === a.id)?.title).toBe(
    "保存した編集",
  );
  expect(await readLast()).toBe(a.id);
  await deleteChart(b.id);
  expect((await listCharts()).map((c) => c.id)).toEqual([a.id]);
});
it("複数PJの保存を1トランザクションで行い、途中の失敗で一部を保存しない", async () => {
  const { saveCharts } = await import("./db");
  const a = createChart(),
    b = createChart();
  await saveCharts([a, b]);
  const changed = { ...a, title: "保存してはいけない変更" },
    bad = { ...b, invalid: () => {} };
  await expect(saveCharts([changed, bad])).rejects.toThrow();
  expect((await listCharts()).find((c) => c.id === a.id)?.title).toBe(a.title);
});
it("allの古い保存要求が名前変更や削除を巻き戻さない", async () => {
  const { saveCharts } = await import("./db");
  const a = createChart();
  await saveChart(a);
  const stale = structuredClone(a);
  a.title = "最新の名前";
  await saveChart(a);
  stale.rows[0].note = "移動対象のデータ";
  await saveCharts([stale], true);
  const saved = (await listCharts()).find((c) => c.id === a.id)!;
  expect(saved.title).toBe("最新の名前");
  expect(saved.rows[0].note).toBe("移動対象のデータ");
  await deleteChart(a.id);
  await saveCharts([stale], true);
  expect((await listCharts()).find((c) => c.id === a.id)).toBeUndefined();
});
