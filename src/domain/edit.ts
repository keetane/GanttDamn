import { uid, type Bar, type Chart, type Row, type Selection } from "./model";
import { periodsFor, timeKey } from "./timeline";
export function subtractRange(bars: Bar[], start: string, end: string): Bar[] {
  return bars.flatMap((bar) => {
    if (
      timeKey(bar.endDateExclusive) <= timeKey(start) ||
      timeKey(bar.startDate) >= timeKey(end)
    )
      return [bar];
    const result: Bar[] = [];
    if (timeKey(bar.startDate) < timeKey(start))
      result.push({ ...bar, endDateExclusive: start });
    if (timeKey(bar.endDateExclusive) > timeKey(end))
      result.push({ ...bar, id: uid(), startDate: end });
    return result;
  });
}
export function paint(
  chart: Chart,
  selection: Selection,
  color: string | null,
) {
  const periods = periodsFor(chart);
  const start =
    periods[Math.min(selection.colStart, selection.colEnd)]?.startDate;
  const end =
    periods[Math.max(selection.colStart, selection.colEnd)]?.endDateExclusive;
  if (!start || !end) return;
  for (
    let i = Math.min(selection.rowStart, selection.rowEnd);
    i <= Math.max(selection.rowStart, selection.rowEnd);
    i++
  ) {
    const row = chart.rows[i];
    if (!row) continue;
    row.bars = subtractRange(row.bars, start, end);
    row.milestones = row.milestones.filter(
      (m) =>
        timeKey(m.date) < timeKey(start) || timeKey(m.date) >= timeKey(end),
    );
    if (color)
      row.bars.push({
        id: uid(),
        startDate: start,
        endDateExclusive: end,
        color,
        label: "",
        style: chart.displaySettings.barStyle,
        textColor: "#ffffff",
        align: "left",
      });
    row.bars.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
}
export function replaceBar(row: Row, bar: Bar) {
  row.bars = [
    ...subtractRange(
      row.bars.filter((b) => b.id !== bar.id),
      bar.startDate,
      bar.endDateExclusive,
    ),
    bar,
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));
}
export function normalizeRows(chart: Chart) {
  chart.rows.forEach((r, i) => (r.sortOrder = i));
}
