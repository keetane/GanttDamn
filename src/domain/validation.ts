import { timeKey } from "./timeline";
import type { Chart } from "./model";
const fail = () => {
  throw new Error(
    "JSONの形式が正しくありません。GanttDamn のバージョン1のファイルを選択してください。",
  );
};
const object = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : fail();
const str = (v: unknown, max = 1000) =>
  typeof v === "string" && v.length <= max ? v : fail();
const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? v
    : fail();
const integer = (v: unknown, min: number, max: number) =>
  Number.isInteger(num(v, min, max)) ? v : fail();
const color = (v: unknown) => (/^#[0-9a-f]{6}$/i.test(str(v, 7)) ? v : fail());
export function validDate(v: unknown): v is string {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    v < "1900-01-01" ||
    v > "2299-12-31"
  )
    return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export function validScheduleDate(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return (
    (/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v) &&
      validDate(v.slice(0, 10))) ||
    validDate(v)
  );
}

const date = (v: unknown) => (validScheduleDate(v) ? v : fail());
export function validateChart(input: unknown): Chart {
  const c = object(input);
  if (
    c.overviewProjects !== undefined ||
    c.id === "__all__" ||
    c.id === "__all_names__"
  )
    fail();
  if (
    c.schemaVersion !== 1 ||
    !["hour", "day", "week", "month", "quarter"].includes(String(c.timeScale))
  )
    fail();
  str(c.id, 100);
  str(c.title, 200);
  str(c.updatedAt, 100);
  if (!validDate(c.visibleStartDate)) fail();
  if (c.workCalendar !== undefined) {
    const w = object(c.workCalendar);
    integer(w.startHour, 0, 23);
    integer(w.endHour, 1, 24);
    if (
      Number(w.startHour) >= Number(w.endHour) ||
      !Array.isArray(w.weekdays) ||
      w.weekdays.length < 1 ||
      w.weekdays.length > 7 ||
      new Set(w.weekdays).size !== w.weekdays.length
    )
      fail();
    (w.weekdays as unknown[]).forEach((v) => integer(v, 0, 6));
  }
  if (String(c.visibleStartDate) > "2199-12-31") fail();
  if (c.projectEndDate !== undefined) {
    if (
      !validDate(c.projectEndDate) ||
      c.projectEndDate < String(c.visibleStartDate)
    )
      fail();
  }
  integer(c.visiblePeriodCount, 1, 240);
  const d = object(c.displaySettings);
  ["showTitle", "showNote", "showGrid", "showYear", "rounded"].forEach((k) => {
    if (typeof d[k] !== "boolean") fail();
  });
  if (d.showToday !== undefined && typeof d.showToday !== "boolean") fail();
  for (const key of ["titleColumnLabel", "noteColumnLabel"])
    if (d[key] !== undefined) str(d[key], 100);
  num(d.fontSize, 10, 28);
  num(d.columnWidth, 40, 200);
  num(d.rowHeight, 32, 120);
  num(d.titleWidth, 100, 500);
  num(d.noteWidth, 80, 400);
  color(d.background);
  if (!["cell", "bar"].includes(String(d.barStyle))) fail();
  if (!Array.isArray(c.rows) || c.rows.length > 500) fail();
  const ids = new Set<string>();
  const id = (v: unknown) => {
    const s = str(v, 100);
    if (!s || ids.has(s)) fail();
    ids.add(s);
  };
  (c.rows as unknown[]).forEach((raw, i) => {
    const r = object(raw);
    id(r.id);
    str(r.title);
    str(r.note, 5000);
    num(r.height, 32, 120);
    integer(r.sortOrder, 0, 500);
    if (r.sortOrder !== i) fail();
    if (
      !Array.isArray(r.bars) ||
      !Array.isArray(r.milestones) ||
      r.bars.length > 500 ||
      r.milestones.length > 500
    )
      fail();
    const ranges: { s: string; e: string }[] = [];
    (r.bars as unknown[]).forEach((v) => {
      const b = object(v);
      id(b.id);
      const s = date(b.startDate),
        e = date(b.endDateExclusive);
      if (timeKey(s) >= timeKey(e)) fail();
      ranges.push({ s, e });
      str(b.label);
      color(b.color);
      color(b.textColor);
      if (
        !["cell", "bar"].includes(String(b.style)) ||
        !["left", "center"].includes(String(b.align))
      )
        fail();
    });
    ranges.sort((a, b) => a.s.localeCompare(b.s));
    if (ranges.some((r, j) => j > 0 && timeKey(ranges[j - 1].e) > timeKey(r.s)))
      fail();
    (r.milestones as unknown[]).forEach((v) => {
      const m = object(v);
      id(m.id);
      date(m.date);
      str(m.label);
      color(m.color);
    });
  });
  const result = structuredClone(c) as unknown as Chart;
  delete result.overviewMode;
  result.rows.forEach((r) => {
    delete r.projectId;
    delete r.projectTitle;
    delete r.sourceRowId;
  });
  return result;
}
