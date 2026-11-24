import { it, expect } from "vitest";
import { createChart, createRow, palette } from "./model";
import { paint } from "./edit";
import { overviewChart, splitOverview } from "./overview";
import { moveFollowingBars } from "./barMove";
import { milestoneGroups, rowGroupsFor, presentationSettings } from "./rows";
import { useChartStore } from "../store/chartStore";
it("同じ行・バーIDを持つPJもall上で区別し、PJ間ではセル結合しない", () => {
  const a = createChart();
  paint(a, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 }, palette[0]);
  const b = structuredClone(a);
  b.id = crypto.randomUUID();
  const all = overviewChart([a, b], a);
  expect(new Set(all.rows.map((r) => r.id)).size).toBe(2);
  expect(new Set(all.rows.flatMap((r) => r.bars.map((b) => b.id))).size).toBe(
    2,
  );
  expect(milestoneGroups(all.rows)[0].end).toBe(0);
  expect(splitOverview(all)).toEqual([a, b]);
});
it("単独PJ移動は他PJを変更せず、all移動は後続アイテムを全PJ移動", () => {
  const a = createChart();
  paint(a, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 }, palette[0]);
  const b = createChart();
  paint(b, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 }, palette[1]);
  paint(b, { rowStart: 0, rowEnd: 0, colStart: 3, colEnd: 3 }, palette[2]);
  const before = structuredClone(b);
  moveFollowingBars(a, a.rows[0].bars[0].id, 1);
  expect(b).toEqual(before);
  const all = overviewChart([a, b], a),
    plan = moveFollowingBars(all, all.rows[0].bars[0].id, 1),
    result = splitOverview(plan);
  expect(result[0].rows[0].bars[0].startDate).toBe("2027-03-01");
  expect(result[1].rows[0].bars.map((b) => b.startDate)).toEqual([
    "2027-01-01",
    "2027-05-01",
  ]);
  expect(a.rows[0].bars[0].startDate).toBe("2027-02-01");
});
it("allのUndo/Redoが全PJの移動を1回で復元", () => {
  const a = createChart();
  paint(a, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 }, palette[0]);
  const b = createChart();
  b.rows = [{ ...createRow(), bars: structuredClone(a.rows[0].bars) }];
  const all = overviewChart([a, b], a);
  useChartStore.getState().load(all);
  const moved = moveFollowingBars(all, all.rows[0].bars[0].id, 1);
  useChartStore.getState().edit((c) => {
    c.rows = moved.rows;
  });
  useChartStore.getState().undo();
  expect(splitOverview(useChartStore.getState().chart)).toEqual([a, b]);
  useChartStore.getState().redo();
  expect(
    splitOverview(useChartStore.getState().chart).map(
      (c) => c.rows[0].bars[0].startDate,
    ),
  ).toEqual(["2027-03-01", "2027-03-01"]);
});
it("内部overview情報を外部JSONから読み込まず、範囲JSONには含めない", async () => {
  const { validateChart } = await import("./validation");
  const { chartForDisplay } = await import("./displayWindow");
  const a = createChart(),
    all = overviewChart([a], a);
  expect(() => validateChart(all)).toThrow();
  const exported = chartForDisplay(all);
  expect(exported.overviewProjects).toBeUndefined();
  expect(exported.id).not.toBe("__all__");
  expect(() => validateChart(exported)).not.toThrow();
});
it("allのまとめ移動では後続のダイヤモンドも移動し、以前のアイテムは保持", () => {
  const a = createChart();
  paint(a, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 1 }, palette[0]);
  a.rows[0].milestones = [
    {
      id: crypto.randomUUID(),
      date: "2027-01-15",
      label: "before",
      color: palette[0],
    },
    {
      id: crypto.randomUUID(),
      date: "2027-04-01",
      label: "after",
      color: palette[0],
    },
  ];
  const all = overviewChart([a], a),
    moved = moveFollowingBars(all, all.rows[0].bars[0].id, 1);
  expect(splitOverview(moved)[0].rows[0].milestones.map((m) => m.date)).toEqual(
    ["2027-01-15", "2027-05-01"],
  );
});
it("出力もPJ間だけを黒線で区切り、最下部にはPJ区切り線を引かない", async () => {
  const { chartSvg, buildWorkbook } = await import("../export/chartExport");
  const a = createChart();
  a.title = "Project X";
  a.rows = [
    createRow("Merged", "A"),
    { ...createRow("Merged", "B"), sortOrder: 1 },
  ];
  const b = createChart();
  b.title = "Project Y";
  const all = overviewChart([a, b], a),
    svg = chartSvg(all);
  expect(svg.split("Project X")).toHaveLength(2);
  expect(svg).toContain('stroke="#000000" stroke-width="1"');
  expect(svg).not.toContain('stroke-width="3"');
  expect(svg.match(/stroke="#000000" stroke-width="1"/g)).toHaveLength(1);
  const sheet = (await buildWorkbook(all)).getWorksheet("Timeline")!;
  expect(sheet.getCell("A4").value).toBe("Project X\nMerged");
  expect(sheet.getCell("A5").isMerged).toBe(true);
  expect(sheet.getCell("B4").border.top?.style).toBeUndefined();
  expect(sheet.getCell("B5").border.bottom?.style).toBe("thin");
  expect(sheet.getCell("B5").border.bottom?.color?.argb).toBe("FF000000");
  expect(sheet.getCell("B6").border.bottom?.color?.argb).toBe("FFDCE5DF");
  expect(chartSvg(overviewChart([a], a))).not.toContain('stroke="#000000"');
});
it("all project nameはPJごとに1行・1本のバーにまとめ、元の項目と保存データを保持する", async () => {
  const { chartSvg, buildWorkbook } = await import("../export/chartExport");
  const { chartForDisplay } = await import("./displayWindow");
  const a = createChart();
  a.title = "Project X";
  a.rows = [createRow("Hidden task A", "Hidden note A"), { ...createRow("Hidden task B", "Hidden note B"), sortOrder: 1 }];
  a.rows[0].height = 80;
  paint(a, { rowStart: 0, rowEnd: 0, colStart: 1, colEnd: 2 }, palette[0]);
  paint(a, { rowStart: 1, rowEnd: 1, colStart: 5, colEnd: 6 }, palette[1]);
  a.rows[1].milestones = [{ id: crypto.randomUUID(), date: "2027-04-01", label: "Release", color: palette[1] }];
  const b = createChart();
  b.title = "Project Y";
  const all = overviewChart([a,b], a, "projects");
  expect(all.id).toBe("__all_names__");
  expect(presentationSettings(all).showNote).toBe(false);
  expect(all.rows).toHaveLength(2);
  expect(rowGroupsFor(all).map(g => [g.start,g.end])).toEqual([[0,0],[1,1]]);
  expect(all.rows[0].bars).toHaveLength(1);
  expect(all.rows[0].bars[0]).toMatchObject({startDate: "2027-02-01", endDateExclusive: "2027-08-01", label: ""});
  expect(all.rows[1].bars).toHaveLength(0);
  expect(splitOverview(all)).toEqual([a,b]);
  const moved = splitOverview(moveFollowingBars(all, all.rows[0].bars[0].id, 1))[0];
  expect(moved.rows[0].title).toBe("Hidden task A");
  expect(moved.rows[0].height).toBe(80);
  expect(moved.rows[1].note).toBe("Hidden note B");
  expect(moved.rows[0].bars[0].startDate).toBe("2027-03-01");
  expect(moved.rows[1].milestones[0].date).toBe("2027-05-01");
  const svg = chartSvg(all);
  expect(svg).toContain("Project X");
  expect(svg).toContain("Release");
  expect(svg).not.toContain("Hidden task");
  expect(svg).not.toContain("Hidden note");
  expect(svg).not.toContain('stroke="#000000"');
  const sheet = (await buildWorkbook(all)).getWorksheet("Timeline")!;
  expect(sheet.getCell("A3").value).toBe("project");
  expect(sheet.getCell("A4").value).toBe("Project X");
  expect(sheet.getCell("A5").isMerged).toBe(false);
  expect(sheet.getCell("A5").value).toBe("Project Y");
  expect(sheet.columnCount).toBe(13);
  expect(sheet.getCell("E4").value).toBe("◆ Release");
  expect(sheet.getCell("B4").border.bottom?.color?.argb).toBe("FFDCE5DF");
  expect(sheet.getCell("B5").border.bottom?.color?.argb).toBe("FFDCE5DF");
  const exported = chartForDisplay(all);
  expect(exported.overviewMode).toBeUndefined();
  expect(exported.displaySettings.showNote).toBe(false);
  expect(exported.rows.map(r=>[r.title,r.note])).toEqual([["Project X",""],["Project Y",""]]);
  expect(overviewChart([a,b], all, "items").rows[0].title).toBe("Hidden task A");
});
it("PJ集約バーの移動は元の全行に反映し、Undo/Redoと範囲外失敗でデータを保持", () => {
  const a = createChart(), b = createChart();
  a.rows.push({ ...createRow("Later", "Keep note"), sortOrder: 1 });
  paint(a, {rowStart:0,rowEnd:0,colStart:1,colEnd:2}, palette[0]);
  paint(a, {rowStart:1,rowEnd:1,colStart:5,colEnd:6}, palette[1]);
  paint(b, {rowStart:0,rowEnd:0,colStart:0,colEnd:0}, palette[2]);
  paint(b, {rowStart:0,rowEnd:0,colStart:8,colEnd:8}, palette[3]);
  const all = overviewChart([a,b], a, "projects"), before = structuredClone(all);
  const moved = moveFollowingBars(all,all.rows[0].bars[0].id,1);
  expect(all).toEqual(before);
  const sources = splitOverview(moved);
  expect(sources[0].rows.map(r=>r.bars[0].startDate)).toEqual(["2027-03-01","2027-07-01"]);
  expect(sources[1].rows[0].bars.map(b=>b.startDate)).toEqual(["2027-01-01","2027-10-01"]);
  useChartStore.getState().load(all);
  useChartStore.getState().edit(c=>{ c.rows=moved.rows; c.overviewProjects=moved.overviewProjects; });
  useChartStore.getState().undo();
  expect(splitOverview(useChartStore.getState().chart)).toEqual([a,b]);
  useChartStore.getState().redo();
  expect(splitOverview(useChartStore.getState().chart)).toEqual(sources);
  expect(()=>moveFollowingBars(all,all.rows[0].bars[0].id,-2)).toThrow();
  expect(all).toEqual(before);
});

it("一覧でも単独バー・マーカーは他PJを変えず、集約移動を元データに反映", () => {
  const a = createChart(), b = createChart();
  paint(a, {rowStart:0,rowEnd:0,colStart:0,colEnd:0},palette[0]);
  paint(b, {rowStart:0,rowEnd:0,colStart:0,colEnd:0},palette[1]);
  a.rows[0].milestones.push({id:crypto.randomUUID(),date:"2027-03-01",label:"mark",color:palette[0]});
  const all = overviewChart([a,b],a);
  const single = splitOverview(moveFollowingBars(all,all.rows[0].bars[0].id,1,"single"));
  expect(single[0].rows[0].bars[0].startDate).toBe("2027-02-01");
  expect(single[1].rows).toEqual(b.rows);
  const summary = overviewChart([a,b],a,"projects");
  const moved = splitOverview(moveFollowingBars(summary,summary.rows[0].bars[0].id,1,"single"));
  expect(moved[0].rows[0].bars[0].startDate).toBe("2027-02-01");
  expect(moved[1].rows).toEqual(b.rows);
  const marker = splitOverview(moveFollowingBars(summary,summary.rows[0].milestones[0].id,1,"milestone"));
  expect(marker[0].rows[0].milestones[0].date).toBe("2027-04-01");
  expect(marker[0].rows[0].bars).toEqual(a.rows[0].bars);
  expect(marker[1].rows).toEqual(b.rows);
});
