import { it, expect } from "vitest";
import { createChart, defaultWorkCalendar, palette } from "./model";
import {
  periodsFor,
  barCells,
  changeTimeScale,
  headerGroups,
  todayPosition,
} from "./timeline";
import { paint, subtractRange } from "./edit";
import { validateChart } from "./validation";
import { chartSvg, buildWorkbook } from "../export/chartExport";
it("既定の稼働時間8–18時を1時間ずつ、金曜から月曜へ並べる", () => {
  const c = createChart("hour", "2026-11-20", 12),
    p = periodsFor(c);
  expect(p[0].startDate).toBe("2026-11-20T08:00");
  expect(p[9].endDateExclusive).toBe("2026-11-20T18:00");
  expect(p[10].startDate).toBe("2026-11-23T08:00");
  expect(headerGroups(p.slice(0, 12)).map((g) => g.label)).toEqual([
    "2026-11-20",
    "2026-11-23",
  ]);
  expect(todayPosition(p, "2026-11-20T08:30")).toBe(0.5);
});
it("日表示は月–金、変更した稼働曜日と時間も反映", () => {
  const c = createChart("day", "2026-11-20", 3);
  expect(
    periodsFor(c)
      .slice(0, 3)
      .map((p) => p.startDate),
  ).toEqual(["2026-11-20", "2026-11-23", "2026-11-24"]);
  c.timeScale = "hour";
  c.workCalendar = { startHour: 10, endHour: 12, weekdays: [6] };
  expect(
    periodsFor(c)
      .slice(0, 3)
      .map((p) => p.startDate),
  ).toEqual(["2026-11-21T10:00", "2026-11-21T11:00", "2026-11-28T10:00"]);
});
it("時間単位のバーを塗り分けてJSON復元し、全単位を往復しても日付を保持", () => {
  const c = createChart("hour", "2027-01-01", 20);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 3 }, palette[0]);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 }, palette[1]);
  expect(c.rows[0].bars).toHaveLength(3);
  expect(validateChart(JSON.parse(JSON.stringify(c)))).toEqual(c);
  const rows = structuredClone(c.rows);
  for (const scale of ["day", "week", "month", "quarter", "hour"] as const) {
    changeTimeScale(c, scale);
    expect(c.rows).toEqual(rows);
  }
  expect(barCells(rows[0].bars[0], periodsFor(c))).toEqual({
    start: 0,
    end: 0,
  });
});
it("日付だけの旧データと時刻付きデータの午前0時境界を等しく扱う", () => {
  const c = createChart();
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 }, palette[0]);
  expect(
    subtractRange(c.rows[0].bars, "2027-02-01T00:00", "2027-02-02T00:00"),
  ).toEqual(c.rows[0].bars);
  expect(
    barCells(
      { startDate: "2027-01-01", endDateExclusive: "2027-01-02T00:00" },
      periodsFor(createChart("hour", "2027-01-01", 20)),
    ),
  ).toEqual({ start: 0, end: 9 });
});
it("不正な時刻、空の稼働曜日、不正な稼働時間を拒否する", () => {
  const c = createChart("hour");
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 }, palette[0]);
  c.rows[0].bars[0].startDate = "2027-01-01T25:00";
  expect(() => validateChart(c)).toThrow();
  for (const w of [
    { ...defaultWorkCalendar, weekdays: [] },
    { ...defaultWorkCalendar, startHour: 18, endHour: 8 },
    { ...defaultWorkCalendar, weekdays: [1, 1] },
  ])
    expect(() =>
      validateChart({ ...createChart(), workCalendar: w }),
    ).toThrow();
});
it("時間軸とバーをSVGとXLSXに出力", async () => {
  const c = createChart("hour", "2027-01-01", 12);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 1 }, palette[0]);
  const svg = chartSvg(c);
  expect(svg).toContain("8:00");
  expect(svg).toContain("2027-01-01");
  const wb = await buildWorkbook(c),
    s = wb.getWorksheet("Timeline")!;
  expect(s.getCell("C2").value).toBe("2027-01-01");
  expect(s.getCell("C3").value).toBe("8:00");
  expect(s.getCell("C4").fill).toMatchObject({ fgColor: { argb: "FF477de0" } });
});
