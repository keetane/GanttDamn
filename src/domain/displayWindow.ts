import { uid } from "./model";
import type { Chart } from "./model";
import {
  periodsFor,
  barCells,
  containsMilestone,
  timeKey,
  dateString,
} from "./timeline";
import { addDays, parseISO } from "date-fns";
export function displayPeriods(chart: Chart, startIndex = 0) {
  const all = periodsFor(chart),
    start = Math.max(
      0,
      Math.min(
        Math.floor(startIndex),
        Math.max(0, all.length - chart.visiblePeriodCount),
      ),
    );
  return all.slice(start, start + chart.visiblePeriodCount);
}
export function chartForDisplay(chart: Chart, startIndex = 0): Chart {
  const p = displayPeriods(chart, startIndex),
    copy = structuredClone(chart);
  if (copy.overviewProjects) copy.id = uid();
  delete copy.overviewProjects;
  if (copy.overviewMode === "projects") {
    copy.displaySettings.showNote = false;
    copy.displaySettings.titleColumnLabel = "project";
    copy.rows.forEach((r) => {
      r.title = r.projectTitle ?? r.title;
      r.note = "";
    });
  }
  delete copy.overviewMode;
  copy.rows.forEach((r) => {
    delete r.projectId;
    delete r.projectTitle;
    delete r.sourceRowId;
  });
  if (!p.length) {
    copy.rows.forEach((r) => {
      r.bars = [];
      r.milestones = [];
    });
    return copy;
  }
  const start = p[0].startDate,
    end = p.at(-1)!.endDateExclusive;
  copy.visibleStartDate = start.slice(0, 10);
  copy.projectEndDate =
    end.includes("T") && !end.endsWith("T00:00")
      ? end.slice(0, 10)
      : dateString(addDays(parseISO(end.slice(0, 10)), -1));
  copy.rows.forEach((r) => {
    r.bars = r.bars
      .filter((b) => barCells(b, p))
      .map((b) => ({
        ...b,
        startDate: timeKey(b.startDate) < timeKey(start) ? start : b.startDate,
        endDateExclusive:
          timeKey(b.endDateExclusive) > timeKey(end) ? end : b.endDateExclusive,
      }));
    r.milestones = r.milestones.filter((m) =>
      p.some((period) => containsMilestone(period, m.date)),
    );
  });
  return copy;
}
