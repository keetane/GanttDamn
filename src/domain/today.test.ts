import { expect, it } from "vitest";
import { generateTimeline, todayPosition } from "./timeline";
import { createChart } from "./model";
import { validateChart } from "./validation";
import { chartSvg } from "../export/chartExport";
it.each(["day", "week", "month", "quarter"] as const)(
  "%sで今日を含むセル内に配置",
  (scale) => {
    const p = generateTimeline(scale, "2026-11-21", 3);
    const x = todayPosition(p, "2026-11-21")!;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(1);
  },
);
it("日単位はセル中央、範囲終了日は対象外", () => {
  const p = generateTimeline("day", "2026-12-31", 2);
  expect(todayPosition(p, "2027-01-01")).toBe(1.5);
  expect(todayPosition(p, "2027-01-02")).toBeNull();
  expect(todayPosition(p, "2026-12-30")).toBeNull();
});
it("うるう年の月でも日数で配置", () => {
  expect(
    todayPosition(generateTimeline("month", "2024-02-01", 1), "2024-02-29"),
  ).toBeCloseTo(28.5 / 29);
});
it("旧データの設定省略を許容し、不正な型を拒否", () => {
  const c = createChart();
  delete c.displaySettings.showToday;
  expect(() => validateChart(c)).not.toThrow();
  expect(() =>
    validateChart({
      ...c,
      displaySettings: { ...c.displaySettings, showToday: "yes" },
    }),
  ).toThrow();
});
it("SVGにも反映し、オフなら描画しない", () => {
  const now = new Date();
  const start = `${now.getFullYear()}-01-01`;
  const c = createChart("month", start);
  expect(chartSvg(c)).toContain("data-today=");
  c.displaySettings.showToday = false;
  expect(chartSvg(c)).not.toContain("data-today=");
});
