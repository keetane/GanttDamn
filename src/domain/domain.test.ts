import { describe, it, expect } from "vitest";
import { generateTimeline, barCells } from "./timeline";
import { createChart, palette } from "./model";
import { paint, replaceBar } from "./edit";
import { validateChart } from "./validation";
import { sampleChart } from "./sample";
import { useChartStore } from "../store/chartStore";
describe("時間軸", () => {
  it.each(["day", "week", "month", "quarter"] as const)(
    "%sの連続した期間を生成する",
    (scale) => {
      const p = generateTimeline(scale, "2026-12-31", 5);
      expect(p).toHaveLength(5);
      for (let i = 1; i < p.length; i++)
        expect(p[i - 1].endDateExclusive).toBe(p[i].startDate);
    },
  );
  it("年をまたぐ週は月末側にまとめる", () => {
    const p = generateTimeline("week", "2020-12-28", 2);
    expect(p.map((v) => [v.startDate, v.endDateExclusive])).toEqual([
      ["2020-12-28", "2021-01-04"],
      ["2021-01-04", "2021-01-11"],
    ]);
    expect(p[0].month).toBe("2020-12");
    expect(p[1].month).toBe("2021-01");
  });
  it("四半期を暦年に合わせる", () => {
    expect(
      generateTimeline("quarter", "2026-11-21", 2).map((p) => p.startDate),
    ).toEqual(["2026-10-01", "2027-01-01"]);
  });
  it("終了日を含めずマッピングする", () => {
    expect(
      barCells(
        { startDate: "2027-01-15", endDateExclusive: "2027-03-01" },
        generateTimeline("month", "2027-01-01", 4),
      ),
    ).toEqual({ start: 0, end: 1 });
  });
});
describe("範囲編集", () => {
  const range = (s: number, e: number) => ({
    rowStart: 0,
    rowEnd: 0,
    colStart: s,
    colEnd: e,
  });
  it("一部を消すと左右に分割する", () => {
    const c = createChart();
    paint(c, range(0, 5), palette[0]);
    paint(c, range(2, 3), null);
    expect(
      c.rows[0].bars.map((b) => [b.startDate, b.endDateExclusive]),
    ).toEqual([
      ["2027-01-01", "2027-03-01"],
      ["2027-05-01", "2027-07-01"],
    ]);
  });
  it("重複範囲を置換し離れたバーを残す", () => {
    const c = createChart();
    paint(c, range(0, 3), palette[0]);
    paint(c, range(2, 5), palette[1]);
    paint(c, range(9, 10), palette[2]);
    expect(c.rows[0].bars).toHaveLength(3);
    expect(() => validateChart(c)).not.toThrow();
  });
  it("伸縮で隣接バーと重なる部分を切り取る", () => {
    const c = createChart();
    paint(c, range(0, 1), palette[0]);
    paint(c, range(3, 5), palette[1]);
    replaceBar(c.rows[0], {
      ...c.rows[0].bars[0],
      endDateExclusive: "2027-05-01",
    });
    expect(() => validateChart(c)).not.toThrow();
    expect(c.rows[0].bars[1].startDate).toBe("2027-05-01");
  });
});
describe("データの復元と履歴", () => {
  it("JSONで全データを往復する", () => {
    const c = sampleChart();
    expect(validateChart(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });
  it.each([
    { schemaVersion: 2 },
    { ...sampleChart(), visibleStartDate: "2027-02-30" },
    { ...sampleChart(), visiblePeriodCount: 100000 },
  ])("不正データを拒否する", (c) => expect(() => validateChart(c)).toThrow());
  it("Undo/Redoが編集前後を復元する", () => {
    useChartStore.getState().load(createChart());
    useChartStore.getState().edit((c) => (c.title = "更新"));
    useChartStore.getState().undo();
    expect(useChartStore.getState().chart.title).toBe("無題のタイムライン");
    useChartStore.getState().redo();
    expect(useChartStore.getState().chart.title).toBe("更新");
  });
  it("表示設定の変更ではバーの日付を変えない", () => {
    const c = sampleChart();
    useChartStore.getState().load(c);
    useChartStore.getState().edit((c) => {
      c.displaySettings.barStyle = "bar";
      c.displaySettings.columnWidth = 120;
    });
    expect(useChartStore.getState().chart.rows).toEqual(c.rows);
  });
});
