import {
  addYears,
  differenceInCalendarDays,
  addDays,
  addHours,
  startOfDay,
  addWeeks,
  addMonths,
  addQuarters,
  startOfISOWeek,
  startOfMonth,
  startOfQuarter,
  format,
  parseISO,
} from "date-fns";
import {
  defaultWorkCalendar,
  defaultPeriodCounts,
  type WorkCalendar,
  type Bar,
  type Chart,
  type TimeScale,
} from "./model";
export const timeKey = (s: string) => (s.length === 10 ? s + "T00:00" : s);
export const localDateTime = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");
export const containsDate = (p: Period, date: string) =>
  timeKey(p.startDate) <= timeKey(date) &&
  timeKey(date) < timeKey(p.endDateExclusive);
export interface Period {
  startDate: string;
  endDateExclusive: string;
  label: string;
  year: number;
  month?: string;
}
const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
const dayLabel = (d: Date) =>
  format(d, "M/d") + "(" + weekdayNames[d.getDay()] + ")";
export const dateString = (date: Date) => format(date, "yyyy-MM-dd");
const starts: Record<TimeScale, (d: Date) => Date> = {
  hour: startOfDay,
  day: startOfDay,
  week: startOfISOWeek,
  month: startOfMonth,
  quarter: startOfQuarter,
};
const advances: Record<TimeScale, (d: Date, n: number) => Date> = {
  hour: addHours,
  day: addDays,
  week: addWeeks,
  month: addMonths,
  quarter: addQuarters,
};
export function generateTimeline(
  scale: TimeScale,
  start: string,
  count: number,
  calendar?: WorkCalendar,
  endExclusive?: string,
): Period[] {
  if (scale === "week") {
    let cursor = startOfDay(parseISO(start));
    const result: Period[] = [];
    while (
      result.length < count &&
      (!endExclusive || dateString(cursor) < endExclusive)
    ) {
      let end = addWeeks(startOfISOWeek(cursor), 1);
      if (endExclusive && dateString(end) > endExclusive)
        end = parseISO(endExclusive);
      const last = addDays(end, -1),
        a = cursor.getDate(),
        b = last.getDate();
      const crossesMonth =
        format(cursor, "yyyy-MM") !== format(last, "yyyy-MM");
      result.push({
        startDate: dateString(cursor),
        endDateExclusive: dateString(end),
        label: crossesMonth
          ? format(cursor, "M/d") + "〜" + format(last, "M/d")
          : a === b
            ? a + "日"
            : a + "〜" + b + "日",
        year: cursor.getFullYear(),
        month: format(cursor, "yyyy-MM"),
      });
      cursor = end;
    }
    return result;
  }
  if (scale === "hour" || (scale === "day" && calendar)) {
    const work = calendar ?? defaultWorkCalendar;
    let cursor = startOfDay(parseISO(start));
    const result: Period[] = [];
    while (
      result.length < count &&
      (!endExclusive || dateString(cursor) < endExclusive)
    ) {
      if (work.weekdays.includes(cursor.getDay())) {
        if (scale === "day")
          result.push({
            startDate: dateString(cursor),
            endDateExclusive: dateString(addDays(cursor, 1)),
            label: dayLabel(cursor),
            year: cursor.getFullYear(),
          });
        else
          for (
            let h = work.startHour;
            h < work.endHour && result.length < count;
            h++
          ) {
            const date = new Date(cursor);
            date.setHours(h);
            result.push({
              startDate: localDateTime(date),
              endDateExclusive: localDateTime(addHours(date, 1)),
              label: `${h}:00`,
              year: date.getFullYear(),
            });
          }
      }
      cursor = addDays(cursor, 1);
    }
    return result;
  }
  const origin = starts[scale](parseISO(start));
  return Array.from({ length: count }, (_, i) => {
    const date = advances[scale](origin, i);
    return {
      startDate: dateString(date),
      endDateExclusive: dateString(advances[scale](date, 1)),
      label:
        scale === "day"
          ? dayLabel(date)
          : scale === "month"
            ? format(date, "M月")
            : `Q${Math.floor(date.getMonth() / 3) + 1}`,
      year: date.getFullYear(),
    };
  }).filter((p) => !endExclusive || p.startDate < endExclusive);
}
export function projectRange(chart: Chart) {
  const startDate = chart.visibleStartDate;
  const endDate =
    chart.projectEndDate ||
    dateString(addDays(addYears(parseISO(startDate), 3), -1));
  return {
    startDate,
    endDate,
    endDateExclusive: dateString(addDays(parseISO(endDate), 1)),
  };
}
export function periodsFor(chart: Chart) {
  const range = projectRange(chart),
    days = differenceInCalendarDays(
      parseISO(range.endDateExclusive),
      parseISO(range.startDate),
    );
  const count =
    chart.timeScale === "hour"
      ? Math.max(1, days * 24)
      : chart.timeScale === "day"
        ? Math.max(1, days)
        : chart.timeScale === "week"
          ? Math.ceil(days / 7) + 1
          : chart.timeScale === "month"
            ? Math.ceil(days / 28) + 1
            : Math.ceil(days / 89) + 1;
  return generateTimeline(
    chart.timeScale,
    range.startDate,
    count,
    chart.workCalendar ?? defaultWorkCalendar,
    range.endDateExclusive,
  );
}
export function barCells(
  bar: Pick<Bar, "startDate" | "endDateExclusive">,
  periods: Period[],
) {
  const cells = periods
    .map((p, i) =>
      timeKey(p.startDate) < timeKey(bar.endDateExclusive) &&
      timeKey(p.endDateExclusive) > timeKey(bar.startDate)
        ? i
        : -1,
    )
    .filter((i) => i >= 0);
  return cells.length
    ? { start: cells[0], end: cells[cells.length - 1] }
    : null;
}
export function yearGroups(periods: Period[]) {
  const groups: { year: number; count: number; start: number }[] = [];
  periods.forEach((p, i) => {
    const last = groups.at(-1);
    if (last?.year === p.year) last.count++;
    else groups.push({ year: p.year, count: 1, start: i });
  });
  return groups;
}

/** Local calendar date, placed at the center of its day; UTC arithmetic avoids DST shifts. */
export function todayPosition(
  periods: Period[],
  today = periods[0]?.startDate.includes("T")
    ? localDateTime(new Date())
    : dateString(new Date()),
): number | null {
  const index = periods.findIndex((p) => containsDate(p, today));
  if (index < 0) return null;
  if (periods[index].startDate.length > 10) {
    const p = periods[index];
    const stamp = (s: string) => Date.parse(timeKey(s) + ":00Z");
    return (
      index +
      (stamp(today) - stamp(p.startDate)) /
        (stamp(p.endDateExclusive) - stamp(p.startDate))
    );
  }
  today = today.slice(0, 10);
  const day = (s: string) => Date.parse(s + "T00:00:00Z") / 86400000;
  const p = periods[index];
  return (
    index +
    (day(today) - day(p.startDate) + 0.5) /
      (day(p.endDateExclusive) - day(p.startDate))
  );
}

export function headerGroups(periods: Period[]) {
  if (periods[0]?.month) {
    const groups: {
      start: number;
      count: number;
      year: number;
      label: string;
    }[] = [];
    periods.forEach((p, i) => {
      const label = p.year + "年" + Number(p.month!.slice(5)) + "月";
      const last = groups.at(-1);
      if (last?.label === label) last.count++;
      else groups.push({ start: i, count: 1, year: p.year, label });
    });
    return groups;
  }
  if (!periods[0]?.startDate.includes("T"))
    return yearGroups(periods).map((g) => ({ ...g, label: g.year }));
  const groups: {
    start: number;
    count: number;
    year: number;
    label: string;
  }[] = [];
  periods.forEach((p, i) => {
    const label = p.startDate.slice(0, 10);
    const last = groups.at(-1);
    if (last?.label === label) last.count++;
    else groups.push({ start: i, count: 1, year: p.year, label });
  });
  return groups;
}
export { defaultPeriodCounts } from "./model";
export function changeTimeScale(chart: Chart, scale: TimeScale) {
  if (chart.timeScale === scale) return;
  chart.timeScale = scale;
  chart.visiblePeriodCount = defaultPeriodCounts[scale];
}

// Date-only milestones belong to the first visible working hour of that date.
export const containsMilestone = (p: Period, date: string) =>
  p.startDate.includes("T") && date.length === 10
    ? p.startDate.slice(0, 10) === date
    : containsDate(p, date);

/** Resolve the next working instant without changing the schedule or PJ range. */
export function nextWorkingTime(chart: Chart, now = new Date()) {
  const work = chart.workCalendar ?? defaultWorkCalendar;
  let target = new Date(now);
  const hour =
    target.getHours() + target.getMinutes() / 60 + target.getSeconds() / 3600;
  if (work.weekdays.includes(target.getDay())) {
    if (hour < work.startHour) {
      target.setHours(work.startHour, 0, 0, 0);
      return target;
    }
    if (hour < work.endHour) return target;
  }
  target = addDays(startOfDay(target), 1);
  while (!work.weekdays.includes(target.getDay())) target = addDays(target, 1);
  target.setHours(work.startHour, 0, 0, 0);
  return target;
}
export function todayJumpTarget(chart: Chart, now = new Date()) {
  const target = nextWorkingTime(chart, now);
  const at =
    chart.timeScale === "hour" ? localDateTime(target) : dateString(target);
  const position = todayPosition(periodsFor(chart), at);
  return position === null
    ? null
    : {
        visibleStartDate: chart.visibleStartDate,
        visiblePeriodCount: chart.visiblePeriodCount,
        position,
        targetDate: localDateTime(target),
        adjusted: localDateTime(target) !== localDateTime(now),
      };
}

export function dateLineTime(chart: Chart, now = new Date()) {
  const target = nextWorkingTime(chart, now);
  return chart.timeScale === "hour"
    ? localDateTime(target)
    : dateString(target);
}
