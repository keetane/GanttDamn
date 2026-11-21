import { translate } from "../i18n";
import { displayPeriods } from "../domain/displayWindow";
import {
  containsMilestone,
  headerGroups,
  localDateTime,
} from "../domain/timeline";
import { rowGroupsFor, presentationSettings, hasProjectDivider } from "../domain/rows";
import type { Chart } from "../domain/model";
import {
  barCells,
  periodsFor,
  todayPosition,
  dateLineTime,
  dateString,
} from "../domain/timeline";
export interface ExportOptions {
  margin: number;
  wide: boolean;
  scale: number;
  startIndex?: number;
}
export const defaultExportOptions: ExportOptions = {
  margin: 32,
  wide: false,
  scale: 2,
};
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const shorten = (s: string, width: number, size: number) => {
  if (
    [...s].reduce(
      (n, c) => n + (c.charCodeAt(0) > 255 ? size : size * 0.58),
      0,
    ) <= width
  )
    return s;
  let result = "",
    used = 0;
  for (const c of s) {
    used += c.charCodeAt(0) > 255 ? size : size * 0.58;
    if (used > width - size) return result + "…";
    result += c;
  }
  return result;
};
export function chartSvg(
  chart: Chart,
  options: ExportOptions = defaultExportOptions,
): string {
  const d = presentationSettings(chart),
    p = displayPeriods(chart, options.startIndex),
    left = d.titleWidth + (d.showNote ? d.noteWidth : 0),
    width = left + p.length * d.columnWidth,
    titleHeight = d.showTitle ? 60 : 0,
    headerHeight = d.showYear ? 64 : 38,
    height =
      titleHeight + headerHeight + chart.rows.reduce((a, r) => a + r.height, 0);
  const contentWidth = width + options.margin * 2,
    contentHeight = height + options.margin * 2;
  const outWidth = options.wide
      ? Math.max(contentWidth, (contentHeight * 16) / 9)
      : contentWidth,
    outHeight = options.wide ? (outWidth * 9) / 16 : contentHeight;
  const ox = (outWidth - width) / 2,
    oy = (outHeight - height) / 2;
  const svg: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(outWidth)}" height="${Math.ceil(outHeight)}" viewBox="0 0 ${outWidth} ${outHeight}"><rect width="100%" height="100%" fill="${d.background}"/><g transform="translate(${ox},${oy})" font-family="Arial, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif" font-size="${d.fontSize}">`,
  ];
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke = "none",
    radius = 0,
  ) =>
    svg.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`,
    );
  const text = (
    s: string,
    x: number,
    y: number,
    fill = "#263b2d",
    anchor = "start",
    weight = 400,
  ) =>
    svg.push(
      `<text x="${x}" y="${y}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`,
    );
  if (d.showTitle)
    svg.push(
      `<text x="0" y="32" font-size="24" font-weight="700" fill="#183f25">${esc(shorten(chart.title, width, 24))}</text>`,
    );
  const top = titleHeight;
  rect(0, top, width, headerHeight, "#f1f5f3");
  text(
    d.titleColumnLabel ?? "milestone",
    14,
    top + headerHeight / 2 + 5,
    "#536659",
    "start",
    600,
  );
  if (d.showNote)
    text(
      d.noteColumnLabel ?? "action item",
      d.titleWidth + 14,
      top + headerHeight / 2 + 5,
      "#536659",
    );
  if (d.showYear)
    headerGroups(p).forEach((g) =>
      text(
        translate(String(g.label)),
        left + (g.start + g.count / 2) * d.columnWidth,
        top + 21,
        "#536659",
        "middle",
        600,
      ),
    );
  p.forEach((v, i) =>
    text(
      translate(v.label),
      left + (i + 0.5) * d.columnWidth,
      top + headerHeight - 12,
      "#536659",
      "middle",
    ),
  );
  let y = top + headerHeight;
  chart.rows.forEach((r, ri) => {
    const h = r.height;
    if (ri % 2 === 1) rect(0, y, width, h, "#fafcfb");
    if (d.showNote)
      text(
        shorten(r.note, d.noteWidth - 28, d.fontSize),
        d.titleWidth + 14,
        y + h / 2 + 5,
        "#78877d",
      );
    r.bars.forEach((b) => {
      const cells = barCells(b, p);
      if (!cells) return;
      const x = left + cells.start * d.columnWidth,
        w = (cells.end - cells.start + 1) * d.columnWidth,
        inset = d.barStyle === "bar" ? 9 : 0;
      rect(
        x + (inset ? 3 : 0),
        y + inset,
        w - (inset ? 6 : 0),
        h - inset * 2,
        b.color,
        "none",
        inset && d.rounded ? 5 : 0,
      );
      text(
        shorten(b.label, w - 20, d.fontSize),
        b.align === "center" ? x + w / 2 : x + 12,
        y + h / 2 + 5,
        b.textColor,
        b.align === "center" ? "middle" : "start",
      );
    });
    if (d.showGrid) {
      for (let i = 0; i <= p.length; i++)
        svg.push(
          `<path d="M${left + i * d.columnWidth},${y}v${h}" stroke="#dce5df" stroke-opacity=".7"/>`,
        );
      svg.push(`<path d="M0,${y + h}h${width}" stroke="#dce5df"/>`);
    }
    r.milestones.forEach((m) => {
      const i = p.findIndex((v) => containsMilestone(v, m.date));
      if (i < 0) return;
      const x = left + (i + 0.5) * d.columnWidth,
        cy = y + h / 2;
      svg.push(
        `<path d="M${x},${cy - 10}l10,10 -10,10 -10,-10z" fill="${m.color}" stroke="white" stroke-width="2"/><title>${esc(m.label)}</title>`,
      );
    });
    y += h;
  });
  let groupY = top + headerHeight;
  rowGroupsFor(chart).forEach((g, i) => {
    if (g.start !== i) return;
    rect(
      0,
      groupY,
      d.titleWidth - 1,
      g.height - (d.showGrid ? 1 : 0),
      i % 2 === 1 ? "#fafcfb" : d.background,
    );
    if (chart.rows[i].projectTitle && chart.overviewMode !== "projects")
      svg.push(
        `<text x="14" y="${groupY + g.height / 2 - 8}" font-size="11" fill="#72957c">${esc(shorten(chart.rows[i].projectTitle!, d.titleWidth - 28, 11))}</text>`,
      );
    text(
      shorten(
        chart.overviewMode === "projects"
          ? (chart.rows[i].projectTitle ?? chart.rows[i].title)
          : chart.rows[i].title,
        d.titleWidth - 28,
        d.fontSize,
      ),
      14,
      groupY +
        g.height / 2 +
        (chart.rows[i].projectTitle && chart.overviewMode !== "projects"
          ? 12
          : 5),
      "#263b2d",
      "start",
      500,
    );
    groupY += g.height;
  });
  if (d.showGrid) {
    svg.push(
      `<path d="M${d.titleWidth},${top}V${height} M${left},${top}V${height}" stroke="#dce5df"/><rect x="0" y="${top}" width="${width}" height="${height - top}" fill="none" stroke="#dce5df"/>`,
    );
  }
  let projectY = top + headerHeight;
  chart.rows.forEach((row, i) => {
    if (hasProjectDivider(chart, i))
      svg.push(
        `<path d="M0,${projectY + row.height}h${width}" stroke="#000000" stroke-width="1"/>`,
      );
    projectY += row.height;
  });
  const todayAt =
    d.showToday !== false ? todayPosition(p, dateLineTime(chart)) : null;
  if (todayAt !== null) {
    const x = left + todayAt * d.columnWidth;
    svg.push(
      `<defs><clipPath id="timeline-area"><rect x="${left}" y="${top}" width="${p.length * d.columnWidth}" height="${height - top}"/></clipPath></defs><path clip-path="url(#timeline-area)" data-today="${dateLineTime(chart)}" d="M${x},${top + headerHeight}V${height}" stroke="#dc3545" stroke-width="2"/>`,
    );
  }
  svg.push("</g></svg>");
  return svg.join("");
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function filename(c: Chart) {
  return (c.title || "timeline")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .slice(0, 100);
}
export function exportSvg(c: Chart, o: ExportOptions) {
  download(
    new Blob([chartSvg(c, o)], { type: "image/svg+xml;charset=utf-8" }),
    filename(c) + ".svg",
  );
}
export async function exportPng(c: Chart, o: ExportOptions) {
  const svg = chartSvg(c, o),
    url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = Math.ceil(img.width * o.scale),
      h = Math.ceil(img.height * o.scale);
    if (w > 32767 || h > 32767 || w * h > 64000000)
      throw new Error(
        "画像が大きすぎます。倍率または表示期間を小さくしてください。",
      );
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像を生成できません");
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG生成に失敗しました"))),
        "image/png",
      ),
    );
    download(blob, filename(c) + ".png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function buildWorkbook(c: Chart, startIndex = 0) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Timeline");
  const d = presentationSettings(c),
    p = displayPeriods(c, startIndex),
    offset = d.showNote ? 2 : 1,
    last = offset + p.length;
  if (last > 16384)
    throw new Error(
      "Excelの列数上限を超えます。PJ期間を短くするか、日・週・月・Qに切り替えてください。",
    );
  let line = 1;
  sheet.getColumn(1).width = d.titleWidth / 7;
  if (d.showNote) sheet.getColumn(2).width = d.noteWidth / 7;
  p.forEach(
    (_, i) => (sheet.getColumn(offset + i + 1).width = d.columnWidth / 7),
  );
  if (d.showTitle) {
    sheet.mergeCells(line, 1, line, last);
    sheet.getCell(line, 1).value = c.title;
    sheet.getCell(line, 1).font = { size: 20, bold: true };
    sheet.getRow(line++).height = 38;
  }
  if (d.showYear) {
    headerGroups(p).forEach((g) => {
      const start = offset + g.start + 1,
        end = start + g.count - 1;
      if (end > start) sheet.mergeCells(line, start, line, end);
      sheet.getCell(line, start).value =
        typeof g.label === "number" ? g.label : translate(g.label);
    });
    line++;
  }
  sheet.getCell(line, 1).value = d.titleColumnLabel ?? "milestone";
  if (d.showNote)
    sheet.getCell(line, 2).value = d.noteColumnLabel ?? "action item";
  p.forEach(
    (v, i) => (sheet.getCell(line, offset + i + 1).value = translate(v.label)),
  );
  const head = line++;
  c.rows.forEach((r, ri) => {
    const row = sheet.getRow(line++);
    row.height = r.height * 0.75;
    row.getCell(1).value =
      c.overviewMode === "projects"
        ? (r.projectTitle ?? r.title)
        : r.projectTitle
          ? `${r.projectTitle}\n${r.title}`
          : r.title;
    if (d.showNote) row.getCell(2).value = r.note;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: d.fontSize, color: { argb: "FF263B2D" } };
      cell.alignment = { vertical: "middle", wrapText: false };
    });
    if (r.projectTitle)
      row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    for (let i = 1; i <= last; i++) {
      const cell = row.getCell(i);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF" + d.background.slice(1) },
      };
      if (d.showGrid)
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFDCE5DF" } },
          right: { style: "thin", color: { argb: "FFDCE5DF" } },
        };
    }
    if (hasProjectDivider(c, ri)) {
      for (let col = 1; col <= last; col++) {
        const cell = row.getCell(col);
        cell.border = {
          ...cell.border,
          bottom: { style: "thin", color: { argb: "FF000000" } },
        };
      }
    }
    r.bars.forEach((b) => {
      const cells = barCells(b, p);
      if (!cells) return;
      for (let i = cells.start; i <= cells.end; i++) {
        const cell = row.getCell(offset + i + 1);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF" + b.color.slice(1) },
        };
        cell.font = {
          size: d.fontSize,
          color: { argb: "FF" + b.textColor.slice(1) },
        };
        cell.alignment = { vertical: "middle", horizontal: b.align };
      }
      row.getCell(offset + cells.start + 1).value = b.label;
    });
    r.milestones.forEach((m) => {
      const i = p.findIndex((v) => containsMilestone(v, m.date));
      if (i < 0) return;
      const cell = row.getCell(offset + i + 1);
      cell.value = "◆" + (m.label ? " " + m.label : "");
      cell.font = {
        color: { argb: "FF" + m.color.slice(1) },
        size: d.fontSize,
      };
    });
  });
  rowGroupsFor(c).forEach((g, i) => {
    if (g.start === i && g.end > i)
      sheet.mergeCells(head + 1 + g.start, 1, head + 1 + g.end, 1);
  });
  for (let r = 1 + (d.showTitle ? 1 : 0); r <= head; r++) {
    sheet.getRow(r).height = 25;
    for (let col = 1; col <= last; col++) {
      const cell = sheet.getCell(r, col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE4FFED" },
      };
      cell.font = { size: d.fontSize, bold: true, color: { argb: "FF536659" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: col > offset ? "center" : "left",
      };
    }
  }
  sheet.views = [
    {
      state: "frozen",
      xSplit: offset,
      ySplit: head,
      showGridLines: d.showGrid,
    },
  ];
  return wb;
}
export async function exportXlsx(c: Chart, startIndex = 0) {
  const wb = await buildWorkbook(c, startIndex);
  const buffer = await wb.xlsx.writeBuffer();
  download(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename(c) + ".xlsx",
  );
}
