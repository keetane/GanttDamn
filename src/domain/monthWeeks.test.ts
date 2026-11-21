import { it, expect } from "vitest";
import { createChart } from "./model";
import {
  generateTimeline,
  periodsFor,
  changeTimeScale,
  headerGroups,
} from "./timeline";
import { chartSvg, buildWorkbook } from "../export/chartExport";
it("初期表示期間は日15・時間12で、作成と切替で共通", () => {
  expect(createChart("day").visiblePeriodCount).toBe(15);
  expect(createChart("hour").visiblePeriodCount).toBe(12);
  const c = createChart();
  changeTimeScale(c, "day");
  expect(c.visiblePeriodCount).toBe(15);
  changeTimeScale(c, "hour");
  expect(c.visiblePeriodCount).toBe(12);
  expect(createChart("hour", "2027-01-01", 5).visiblePeriodCount).toBe(5);
});
it("日付に日本語の曜日を付ける", () => {
  expect(generateTimeline("day", "2027-01-01", 3).map((p) => p.label)).toEqual([
    "1/1(金)",
    "1/2(土)",
    "1/3(日)",
  ]);
  expect(periodsFor(createChart("day", "2027-01-01"))[1].label).toBe("1/4(月)");
});
it("月またぎ週を分割せず、月末側の年月にまとめる", () => {
  const p = generateTimeline("week", "2027-04-26", 3);
  expect(p.map((v) => [v.startDate, v.endDateExclusive, v.label])).toEqual([
    ["2027-04-26", "2027-05-03", "4/26〜5/2"],
    ["2027-05-03", "2027-05-10", "3〜9日"],
    ["2027-05-10", "2027-05-17", "10〜16日"],
  ]);
  expect(headerGroups(p).map((g) => [g.label, g.count])).toEqual([
    ["2027年4月", 1],
    ["2027年5月", 2],
  ]);
});
it("3年間の最終日まで欠落・重複せず、週の開始月に所属する", () => {
  const p = periodsFor(createChart("week", "2027-01-01"));
  expect(p.at(-1)?.endDateExclusive).toBe("2030-01-01");
  p.forEach((v, i) => {
    expect(v.month).toBe(v.startDate.slice(0, 7));
    if (i > 0) expect(p[i - 1].endDateExclusive).toBe(v.startDate);
  });
});
it("出力にも曜日・月内週の区切りを反映", async () => {
  const d = createChart("day", "2027-01-01");
  expect(chartSvg(d)).toContain("1/4(月)");
  const c = createChart("week", "2027-04-26", 3);
  expect(chartSvg(c)).toContain("2027年5月");
  const s = (await buildWorkbook(c)).getWorksheet("Timeline")!;
  expect(s.getCell("C2").value).toBe("2027年4月");
  expect(s.getCell("D2").value).toBe("2027年5月");
  expect(s.getCell("D3").value).toBe("3〜9日");
});
