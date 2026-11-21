import { it, expect } from "vitest";
import { createChart, createRow } from "./model";
import { milestoneGroups, moveRow } from "./rows";
import { chartSvg, buildWorkbook } from "../export/chartExport";
import { validateChart } from "./validation";
it("連続する同名だけを結合し、空欄や離れた同名は結合しない", () => {
  const rows = ["A", "A", "B", "A", "", ""].map((t) => createRow(t));
  const g = milestoneGroups(rows);
  expect(g[0]).toEqual({ start: 0, end: 1, height: 108 });
  expect(g[1]).toBe(g[0]);
  expect(g[3].start).toBe(3);
  expect(g[4].end).toBe(4);
});
it("行移動はデータを保持し、並び順を再設定", () => {
  const c = createChart();
  c.rows = ["A", "B", "C"].map((t) => createRow(t));
  const row = structuredClone(c.rows[2]);
  moveRow(c, 2, 0);
  expect(c.rows[0]).toEqual({ ...row, sortOrder: 0 });
  expect(c.rows.map((r) => r.title)).toEqual(["C", "A", "B"]);
  expect(() => validateChart(c)).not.toThrow();
  moveRow(c, 0, 2);
  expect(c.rows.map((r) => r.title)).toEqual(["A", "B", "C"]);
});
it("結合と列見出しをSVGとXLSXで再現し、action itemを保持", async () => {
  const c = createChart();
  c.rows = [
    createRow("同じmilestone", "Action A"),
    createRow("同じmilestone", "Action B"),
  ];
  c.displaySettings.titleColumnLabel = "工程";
  c.displaySettings.noteColumnLabel = "作業";
  const svg = chartSvg(c);
  expect(svg.split("同じmilestone")).toHaveLength(2);
  expect(svg).toContain("工程");
  expect(svg).toContain("作業");
  expect(svg).toContain("Action B");
  const wb = await buildWorkbook(c),
    s = wb.getWorksheet("Timeline")!;
  expect(s.getCell("A3").value).toBe("工程");
  expect(s.getCell("A4").isMerged).toBe(true);
  expect(s.getCell("A5").master.address).toBe("A4");
  expect(s.getCell("B4").value).toBe("Action A");
  expect(s.getCell("B5").value).toBe("Action B");
});
