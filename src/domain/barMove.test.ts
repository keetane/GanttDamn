import { it, expect } from "vitest";
import { createChart, createRow, palette, uid } from "./model";
import { paint } from "./edit";
import { moveFollowingBars } from "./barMove";
import { validateChart } from "./validation";
import { dateLineTime } from "./timeline";
import { useChartStore } from "../store/chartStore";
const range = (start: number, end = start) => ({
  rowStart: 0,
  rowEnd: 0,
  colStart: start,
  colEnd: end,
});
it("選択以降の全行のバーを一括移動し、前のバー・マーカー・元データを保持", () => {
  const c = createChart();
  paint(c, range(0), palette[0]);
  paint(c, range(2, 3), palette[1]);
  paint(c, range(6), palette[2]);
  const selected = c.rows[0].bars[1];
  c.rows.push({
    ...createRow("別行"),
    sortOrder: 1,
    bars: [{ ...selected, id: uid() }],
    milestones: [
      { id: uid(), date: "2027-03-01", label: "保持", color: palette[0] },
    ],
  });
  const before = structuredClone(c),
    moved = moveFollowingBars(c, selected.id, 1);
  expect(moved.rows[0].bars.map((b) => b.startDate)).toEqual([
    "2027-01-01",
    "2027-04-01",
    "2027-08-01",
  ]);
  expect(moved.rows[1].bars[0].startDate).toBe("2027-04-01");
  expect(moved.rows[1].milestones).toEqual(c.rows[1].milestones);
  expect(c).toEqual(before);
  expect(() => validateChart(moved)).not.toThrow();
});
it("前のバーとの衝突は原子的に拒否する", () => {
  const c = createChart();
  paint(c, range(0), palette[0]);
  paint(c, range(2), palette[1]);
  const before = structuredClone(c);
  expect(() => moveFollowingBars(c, c.rows[0].bars[1].id, -2)).toThrow(
    "重なる",
  );
  expect(c).toEqual(before);
});
it("時間表示は非稼働時間を飛ばして全バーを同じセル数移動", () => {
  const c = createChart("hour", "2027-01-01");
  paint(c, range(9), palette[0]);
  paint(c, range(10), palette[1]);
  const moved = moveFollowingBars(c, c.rows[0].bars[0].id, 1);
  expect(
    moved.rows[0].bars.map((b) => [b.startDate, b.endDateExclusive]),
  ).toEqual([
    ["2027-01-04T08:00", "2027-01-04T09:00"],
    ["2027-01-04T09:00", "2027-01-04T10:00"],
  ]);
});
it("日表示は営業日セル単位、PJを超える移動は拒否", () => {
  const c = createChart("day", "2027-01-01");
  paint(c, range(0), palette[0]);
  const moved = moveFollowingBars(c, c.rows[0].bars[0].id, 1);
  expect(moved.rows[0].bars[0].startDate).toBe("2027-01-04");
  expect(() => moveFollowingBars(c, c.rows[0].bars[0].id, -1)).toThrow();
});
it("まとめ移動はUndo/Redo各1回で戻せる", () => {
  const c = createChart();
  paint(c, range(1), palette[0]);
  useChartStore.getState().load(c);
  const plan = moveFollowingBars(c, c.rows[0].bars[0].id, 1);
  useChartStore.getState().edit((d) => {
    d.rows = plan.rows;
  });
  useChartStore.getState().undo();
  expect(useChartStore.getState().chart.rows).toEqual(c.rows);
  useChartStore.getState().redo();
  expect(useChartStore.getState().chart.rows).toEqual(plan.rows);
});
it("土日・営業時間外の日付線は次の稼働開始に表示", () => {
  const c = createChart("hour", "2027-01-01");
  expect(dateLineTime(c, new Date(2027, 0, 1, 18))).toBe("2027-01-04T08:00");
  expect(dateLineTime(c, new Date(2027, 0, 2, 12))).toBe("2027-01-04T08:00");
  expect(dateLineTime(c, new Date(2027, 0, 4, 7))).toBe("2027-01-04T08:00");
  c.timeScale = "day";
  expect(dateLineTime(c, new Date(2027, 0, 1, 18))).toBe("2027-01-04");
});
