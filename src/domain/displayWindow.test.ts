import { it, expect } from "vitest";
import { createChart, palette } from "./model";
import { paint } from "./edit";
import { displayPeriods, chartForDisplay } from "./displayWindow";
import { validateChart } from "./validation";
import {
  chartSvg,
  buildWorkbook,
  defaultExportOptions,
} from "../export/chartExport";
it("表示期間とスクロール位置で出力範囲を決定", () => {
  const c = createChart("month", "2027-01-01", 6);
  expect(displayPeriods(c, 3).map((p) => p.label)).toEqual([
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
  ]);
  expect(displayPeriods(c, 100).at(-1)?.endDateExclusive).toBe("2030-01-01");
});
it("SVGとXLSXは表示範囲外のバーと期間を含めない", async () => {
  const c = createChart("month", "2027-01-01", 6);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 10, colEnd: 11 }, palette[0]);
  c.rows[0].bars[0].label = "範囲外バー";
  const svg = chartSvg(c, { ...defaultExportOptions, startIndex: 3 });
  expect(svg).toContain("4月");
  expect(svg).toContain("9月");
  expect(svg).not.toContain("範囲外バー");
  expect(svg).not.toContain("10月");
  expect(svg).not.toContain("2028");
  const s = (await buildWorkbook(c, 3)).getWorksheet("Timeline")!;
  expect(s.columnCount).toBe(8);
  expect(s.getCell("C3").value).toBe("4月");
  expect(s.getCell("H3").value).toBe("9月");
});
it("JSONは範囲内のデータに限定し両端を切り詰め、元データを保持", () => {
  const c = createChart("month", "2027-01-01", 6);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 11 }, palette[1]);
  const before = structuredClone(c),
    out = chartForDisplay(c, 3);
  expect(out.visibleStartDate).toBe("2027-04-01");
  expect(out.projectEndDate).toBe("2027-09-30");
  expect(out.rows[0].bars[0].startDate).toBe("2027-04-01");
  expect(out.rows[0].bars[0].endDateExclusive).toBe("2027-10-01");
  expect(() => validateChart(out)).not.toThrow();
  expect(c).toEqual(before);
});
it("1時間表示も指定時間セルだけを出力", () => {
  const c = createChart("hour", "2027-01-01", 4);
  paint(c, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 9 }, palette[0]);
  const out = chartForDisplay(c, 3);
  expect(out.rows[0].bars[0].startDate).toBe("2027-01-01T11:00");
  expect(out.rows[0].bars[0].endDateExclusive).toBe("2027-01-01T15:00");
  expect(() => validateChart(out)).not.toThrow();
});
