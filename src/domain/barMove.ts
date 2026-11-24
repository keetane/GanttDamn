import { overviewChart, splitOverview } from "./overview";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { Chart } from "./model";
import { barCells, containsMilestone, periodsFor, projectRange, timeKey } from "./timeline";
const stamp = (s: string) => Date.parse(timeKey(s) + ":00Z");
/** Return an atomic drag plan for one item or the following schedule. */
export function moveFollowingBars(
  chart: Chart,
  barId: string,
  delta: number,
  mode: "following" | "single" | "milestone" = "following",
  projectId?: string,
): Chart {
  if (!Number.isInteger(delta)) throw new Error("セル単位で移動してください");
  if (!delta) return chart;
  if (chart.overviewMode === "projects" && chart.overviewProjects) {
    const row = chart.rows.find((r) => mode === "milestone"
      ? r.milestones.some((m) => m.id === barId) : r.bars.some((b) => b.id === barId));
    if (!row) throw new Error("移動するバーが見つかりません");
    const detailed = overviewChart(chart.overviewProjects, chart, "items");
    if (mode === "milestone") return overviewChart(splitOverview(moveFollowingBars(detailed, barId, delta, mode)), chart, "projects");
    const anchor = detailed.rows
      .filter((r) => r.projectId === row.projectId)
      .flatMap((r) => r.bars)
      .sort((a, b) => timeKey(a.startDate).localeCompare(timeKey(b.startDate)))[0];
    const moved = moveFollowingBars(detailed, anchor.id, delta, "following", mode === "single" ? row.projectId : undefined);
    return overviewChart(splitOverview(moved), chart, "projects");
  }
  const marker = mode === "milestone" ? chart.rows.flatMap(r => r.milestones).find(m => m.id === barId) : undefined;
  const bar = marker ? { startDate: marker.date, endDateExclusive: marker.date } : chart.rows.flatMap((r) => r.bars).find((b) => b.id === barId);
  if (!bar) throw new Error("移動するバーが見つかりません");
  const p = periodsFor(chart),
    cells = marker ? (() => { const index = p.findIndex(v => containsMilestone(v, marker.date)); return index < 0 ? null : { start: index, end: index }; })() : barCells(bar, p);
  if (!cells || !p[cells.start + delta])
    throw new Error("PJ期間を超える移動はできません");
  const anchor = p[cells.start].startDate,
    target = p[cells.start + delta].startDate;
  const monthDelta =
    (parseISO(target).getFullYear() - parseISO(anchor).getFullYear()) * 12 +
    parseISO(target).getMonth() -
    parseISO(anchor).getMonth();
  const dayDelta = differenceInCalendarDays(parseISO(target), parseISO(anchor));
  const shift = (value: string, end: boolean) => {
    if (
      chart.timeScale === "month" ||
      chart.timeScale === "quarter" ||
      chart.timeScale === "week"
    ) {
      const date =
        chart.timeScale === "week"
          ? addDays(parseISO(value), dayDelta)
          : addMonths(parseISO(value), monthDelta);
      return format(
        date,
        value.includes("T") ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd",
      );
    }
    const at = stamp(value);
    let index = end
      ? p
          .map((v, i) => (stamp(v.startDate) < at ? i : -1))
          .reduce((a, b) => Math.max(a, b), -1)
      : p.findIndex((v) => stamp(v.endDateExclusive) > at);
    if (index < 0 || !p[index + delta])
      throw new Error("PJ期間を超える移動はできません");
    const from = p[index],
      to = p[index + delta];
    const fraction = Math.max(
      0,
      Math.min(
        1,
        (at - stamp(from.startDate)) /
          (stamp(from.endDateExclusive) - stamp(from.startDate)),
      ),
    );
    const moved = new Date(
      stamp(to.startDate) +
        fraction * (stamp(to.endDateExclusive) - stamp(to.startDate)),
    );
    const result = moved.toISOString().slice(0, 16);
    return chart.timeScale === "day" && !value.includes("T")
      ? result.slice(0, 10)
      : result;
  };
  const next = structuredClone(chart),
    range = projectRange(chart);
  next.rows.forEach((row) => {
    if (projectId && row.projectId !== projectId) return;
    row.bars.forEach((b) => {
      if (mode !== "milestone" && (mode === "single" ? b.id === barId : timeKey(b.startDate) >= timeKey(bar.startDate))) {
        b.startDate = shift(b.startDate, false);
        b.endDateExclusive = shift(b.endDateExclusive, true);
        if (
          timeKey(b.startDate) < timeKey(range.startDate) ||
          timeKey(b.endDateExclusive) > timeKey(range.endDateExclusive) ||
          timeKey(b.startDate) >= timeKey(b.endDateExclusive)
        )
          throw new Error("PJ期間を超える移動はできません");
      }
    });
    if (mode === "milestone" || (mode === "following" && chart.overviewProjects)) {
      row.milestones.forEach((m) => {
        if (mode === "milestone" ? m.id === barId : timeKey(m.date) >= timeKey(bar.startDate)) {
          m.date = shift(m.date, false);
          if (
            timeKey(m.date) < timeKey(range.startDate) ||
            timeKey(m.date) >= timeKey(range.endDateExclusive)
          )
            throw new Error("PJ期間を超える移動はできません");
        }
      });
    }
    row.bars.sort((a, b) =>
      timeKey(a.startDate).localeCompare(timeKey(b.startDate)),
    );
    if (
      row.bars.some(
        (b, i) =>
          i > 0 &&
          timeKey(row.bars[i - 1].endDateExclusive) > timeKey(b.startDate),
      )
    )
      throw new Error("前のバーと重なるため、この位置には移動できません");
  });
  if (next.overviewProjects) splitOverview(next);
  return next;
}
