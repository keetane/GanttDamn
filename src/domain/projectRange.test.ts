import { it, expect } from "vitest";
import { createChart } from "./model";
import { periodsFor, projectRange, changeTimeScale } from "./timeline";
import { validateChart } from "./validation";
it("終了日省略は開始日から3年間で、画面グリッド数に依存しない", () => {
  const c = createChart("month", "2027-01-01", 4);
  expect(projectRange(c)).toEqual({
    startDate: "2027-01-01",
    endDate: "2029-12-31",
    endDateExclusive: "2030-01-01",
  });
  expect(periodsFor(c)).toHaveLength(36);
  c.visiblePeriodCount = 24;
  expect(periodsFor(c)).toHaveLength(36);
});
it("指定終了日を含む全期間を生成する", () => {
  const c = createChart("hour", "2027-01-01", 4);
  c.projectEndDate = "2027-01-01";
  expect(periodsFor(c)).toHaveLength(10);
  expect(periodsFor(c).at(-1)?.endDateExclusive).toBe("2027-01-01T18:00");
});
it("稼働日がない短いPJ期間は空として扱う", () => {
  const c = createChart("day", "2026-11-21");
  c.projectEndDate = "2026-11-22";
  expect(periodsFor(c)).toEqual([]);
});
it("終了日設定と旧JSONを復元し、不正な日付・逆転を拒否", () => {
  const c = createChart();
  expect(validateChart(c).projectEndDate).toBeUndefined();
  c.projectEndDate = "2027-12-31";
  expect(validateChart(JSON.parse(JSON.stringify(c)))).toEqual(c);
  expect(() => validateChart({ ...c, projectEndDate: "2026-12-31" })).toThrow();
  expect(() => validateChart({ ...c, projectEndDate: "2027-02-30" })).toThrow();
});
it("時間軸を変更してもPJ日付・バーを保持する", () => {
  const c = createChart("month", "2027-01-01");
  c.projectEndDate = "2028-12-31";
  const before = structuredClone(c);
  changeTimeScale(c, "hour");
  expect(c.visibleStartDate).toBe(before.visibleStartDate);
  expect(c.projectEndDate).toBe(before.projectEndDate);
  expect(c.rows).toEqual(before.rows);
  expect(periodsFor(c).length).toBeGreaterThan(5000);
});
