export type TimeScale = "hour" | "day" | "week" | "month" | "quarter";
export const defaultPeriodCounts: Record<TimeScale, number> = {
  hour: 12,
  day: 15,
  week: 12,
  month: 12,
  quarter: 8,
};
export type BarStyle = "cell" | "bar";
export interface Bar {
  id: string;
  startDate: string;
  endDateExclusive: string;
  label: string;
  color: string;
  style: BarStyle;
  textColor: string;
  align: "left" | "center";
}
export interface Milestone {
  id: string;
  date: string;
  label: string;
  color: string;
}
export interface Row {
  projectId?: string;
  projectTitle?: string;
  sourceRowId?: string;
  id: string;
  title: string;
  note: string;
  sortOrder: number;
  height: number;
  bars: Bar[];
  milestones: Milestone[];
}
export interface DisplaySettings {
  showTitle: boolean;
  showNote: boolean;
  showGrid: boolean;
  showYear: boolean;
  showToday?: boolean;
  titleColumnLabel?: string;
  noteColumnLabel?: string;
  fontSize: number;
  columnWidth: number;
  rowHeight: number;
  titleWidth: number;
  noteWidth: number;
  background: string;
  rounded: boolean;
  barStyle: BarStyle;
}
export interface WorkCalendar {
  startHour: number;
  endHour: number;
  weekdays: number[];
}
export const defaultWorkCalendar: WorkCalendar = {
  startHour: 8,
  endHour: 18,
  weekdays: [1, 2, 3, 4, 5],
};
export interface Chart {
  overviewProjects?: Chart[];
  overviewMode?: "items" | "projects";
  workCalendar?: WorkCalendar;
  schemaVersion: 1;
  id: string;
  title: string;
  timeScale: TimeScale;
  visibleStartDate: string; // PJ開始日（旧データのキーを維持）
  projectEndDate?: string; // inclusive; omitted = three years
  visiblePeriodCount: number;
  displaySettings: DisplaySettings;
  rows: Row[];
  updatedAt: string;
}
export interface Selection {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}
export const palette = [
  "#477de0",
  "#409d78",
  "#e79945",
  "#dc6770",
  "#9472cf",
  "#e1bf4e",
  "#89939e",
  "#38a6aa",
];
export const scaleLabels: Record<TimeScale, string> = {
  hour: "1時間",
  day: "日",
  week: "週",
  month: "月",
  quarter: "Q",
};
export const uid = () => crypto.randomUUID();
export const defaultSettings: DisplaySettings = {
  showTitle: true,
  showNote: true,
  showGrid: true,
  showYear: true,
  showToday: true,
  titleColumnLabel: "milestone",
  noteColumnLabel: "action item",
  fontSize: 14,
  columnWidth: 88,
  rowHeight: 54,
  titleWidth: 220,
  noteWidth: 150,
  background: "#ffffff",
  rounded: true,
  barStyle: "cell",
};
export function createRow(title = "新しい項目", note = ""): Row {
  return {
    id: uid(),
    title,
    note,
    sortOrder: 0,
    height: 54,
    bars: [],
    milestones: [],
  };
}
export function createChart(
  timeScale: TimeScale = "month",
  start = "2027-01-01",
  count = defaultPeriodCounts[timeScale],
): Chart {
  return {
    schemaVersion: 1,
    workCalendar: structuredClone(defaultWorkCalendar),
    id: uid(),
    title: "無題のタイムライン",
    timeScale,
    visibleStartDate: start,
    visiblePeriodCount: count,
    displaySettings: { ...defaultSettings },
    rows: [createRow()],
    updatedAt: new Date().toISOString(),
  };
}
