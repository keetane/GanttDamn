import type { Chart, Row } from "./model";
export function milestoneGroups(rows: Row[]) {
  const groups: { start: number; end: number; height: number }[] = [];
  for (let start = 0; start < rows.length; ) {
    let end = start;
    while (
      rows[start].title.trim() &&
      end + 1 < rows.length &&
      rows[end + 1].title === rows[start].title &&
      rows[end + 1].projectId === rows[start].projectId
    )
      end++;
    const group = {
      start,
      end,
      height: rows.slice(start, end + 1).reduce((n, r) => n + r.height, 0),
    };
    for (let i = start; i <= end; i++) groups[i] = group;
    start = end + 1;
  }
  return groups;
}
export function moveRow(chart: Chart, from: number, to: number) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= chart.rows.length ||
    to >= chart.rows.length
  )
    return;
  const [row] = chart.rows.splice(from, 1);
  chart.rows.splice(to, 0, row);
  chart.rows.forEach((r, i) => (r.sortOrder = i));
}

export function rowGroupsFor(chart: Chart) {
  if (chart.overviewMode !== "projects") return milestoneGroups(chart.rows);
  return chart.rows.map((row, i) => ({ start: i, end: i, height: row.height }));
}
export function hasProjectDivider(chart: Chart, index: number) {
  const row = chart.rows[index], next = chart.rows[index + 1];
  return chart.overviewMode !== "projects" && !!row?.projectId && !!next &&
    row.projectId !== next.projectId;
}
export function presentationSettings(chart: Chart) {
  return chart.overviewMode === "projects"
    ? { ...chart.displaySettings, showNote: false, titleColumnLabel: "project" }
    : chart.displaySettings;
}
