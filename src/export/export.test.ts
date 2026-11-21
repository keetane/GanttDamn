import { describe, it, expect } from "vitest";
import { sampleChart } from "../domain/sample";
import { chartSvg, buildWorkbook, defaultExportOptions } from "./chartExport";
describe("データからの全体出力", () => {
  it("画面外の最終行と最終列もSVGに含む", () => {
    const c = sampleChart();
    c.rows.at(-1)!.title = "最終行の項目";
    const svg = chartSvg(c);
    expect(svg).toContain("最終行の項目");
    expect(svg).toContain("12月");
    expect(svg).toContain("運用開始");
    expect(svg).not.toContain("foreignObject");
  });
  it("SVGでXML特殊文字を安全に扱う", () => {
    const c = sampleChart();
    c.title = '<script>&"';
    expect(chartSvg(c)).toContain("&lt;script&gt;&amp;&quot;");
  });
  it("16:9出力で全体を収める", () => {
    const svg = chartSvg(sampleChart(), {
      ...defaultExportOptions,
      wide: true,
    });
    const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!;
    expect(Number(match[1]) / Number(match[2])).toBeCloseTo(16 / 9);
  });
  it("XLSXの項目・年結合・色・列幅・高さを再読み込みして確認", async () => {
    const c = sampleChart(),
      wb = await buildWorkbook(c);
    const buffer = await wb.xlsx.writeBuffer();
    const { default: ExcelJS } = await import("exceljs");
    const restored = new ExcelJS.Workbook();
    await restored.xlsx.load(buffer);
    const s = restored.getWorksheet("Timeline")!;
    expect(s.getCell(4, 1).value).toBe(c.rows[0].title);
    expect(s.getCell(3, 14).value).toBe("12月");
    expect(s.getCell(2, 3).value).toBe(2027);
    expect(s.getCell(2, 14).isMerged).toBe(true);
    expect(s.getCell(4, 3).fill).toMatchObject({
      fgColor: { argb: "FF477de0" },
    });
    expect(s.getColumn(1).width).toBeCloseTo(c.displaySettings.titleWidth / 7);
    expect(s.getRow(4).height).toBe(c.rows[0].height * 0.75);
  });
  it("XLSXのストリーミング読み込みで内容を復元できる", async () => {
    const c = sampleChart();
    const wb = await buildWorkbook(c);
    const bytes = await wb.xlsx.writeBuffer();
    const { default: ExcelJS } = await import("exceljs");
    const { Readable } = await import("node:stream");
    const reader = new ExcelJS.stream.xlsx.WorkbookReader(
      Readable.from([Buffer.from(bytes)]),
      { worksheets: "emit", sharedStrings: "cache", styles: "cache", hyperlinks: "ignore" },
    );
    const items: unknown[] = [];
    for await (const sheet of reader) {
      expect(sheet).toHaveProperty("name", "Timeline");
      for await (const row of sheet) {
        if (row.number >= 4) items.push(row.getCell(1).value);
      }
    }
    expect(items).toEqual(c.rows.map(row => row.title));
  });
});
