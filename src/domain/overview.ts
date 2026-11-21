import type { Chart, Row } from "./model";
import { projectRange, timeKey } from "./timeline";
import { validateChart } from "./validation";
export const ALL_PROJECTS = "__all__";
export const ALL_PROJECT_NAMES = "__all_names__";
const prefix = (project: string, id: string) => `${project}::${id}`;
export function overviewChart(
  projects: Chart[],
  view: Chart,
  mode: "items" | "projects" = view.overviewMode ?? "items",
): Chart {
  const sources = projects.filter(
    (c) =>
      !c.overviewProjects &&
      c.id !== ALL_PROJECTS &&
      c.id !== ALL_PROJECT_NAMES,
  );
  const chart: Chart = {
    ...structuredClone(view),
    id: mode === "projects" ? ALL_PROJECT_NAMES : ALL_PROJECTS,
    title: mode === "projects" ? "all project name" : "all",
    overviewMode: mode,
    overviewProjects: structuredClone(sources),
    visibleStartDate:
      sources.map((c) => c.visibleStartDate).sort()[0] ?? view.visibleStartDate,
    projectEndDate:
      sources
        .map((c) => projectRange(c).endDate)
        .sort()
        .at(-1) ?? projectRange(view).endDate,
    rows: [],
  };
  if (mode === "projects") {
    chart.rows = sources.map((project, index): Row => {
      const bars = project.rows
        .flatMap((row) => row.bars)
        .sort((a, b) => timeKey(a.startDate).localeCompare(timeKey(b.startDate)));
      const first = bars[0];
      return {
        id: prefix(project.id, "summary-row"),
        projectId: project.id,
        projectTitle: project.title,
        title: project.title,
        note: "",
        sortOrder: index,
        height: chart.displaySettings.rowHeight,
        bars: first
          ? [{
              ...first,
              id: prefix(project.id, "summary-bar"),
              label: "",
              endDateExclusive: bars.reduce(
                (end, bar) => timeKey(bar.endDateExclusive) > timeKey(end)
                  ? bar.endDateExclusive : end,
                first.endDateExclusive,
              ),
            }]
          : [],
        milestones: project.rows.flatMap((row) =>
          row.milestones.map((m) => ({ ...m, id: prefix(project.id, m.id) })),
        ),
      };
    });
    return chart;
  }
  sources.forEach((project) =>
    project.rows.forEach((row) =>
      chart.rows.push({
        ...structuredClone(row),
        id: prefix(project.id, row.id),
        projectId: project.id,
        projectTitle: project.title,
        sourceRowId: row.id,
        sortOrder: chart.rows.length,
        bars: row.bars.map((b) => ({ ...b, id: prefix(project.id, b.id) })),
        milestones: row.milestones.map((m) => ({
          ...m,
          id: prefix(project.id, m.id),
        })),
      }),
    ),
  );
  return chart;
}
export function splitOverview(chart: Chart): Chart[] {
  if (!chart.overviewProjects) return [chart];
  const result = structuredClone(chart.overviewProjects);
  if (chart.overviewMode === "projects") {
    result.forEach(validateChart);
    return result;
  }
  for (const source of result) {
    const rows = chart.rows.filter((r) => r.projectId === source.id);
    if (rows.length !== source.rows.length)
      throw new Error("all表示では行構成を変更できません");
    source.rows = source.rows.map((original) => {
      const r = rows.find((r) => r.sourceRowId === original.id);
      if (!r) throw new Error("元の項目が見つかりません");
      return {
        ...original,
        bars: r.bars.map((b) => ({
          ...b,
          id: b.id.slice(source.id.length + 2),
        })),
        milestones: r.milestones.map((m) => ({
          ...m,
          id: m.id.slice(source.id.length + 2),
        })),
      };
    });
    if (
      JSON.stringify(source.rows) !==
      JSON.stringify(
        chart.overviewProjects.find((c) => c.id === source.id)!.rows,
      )
    )
      source.updatedAt = chart.updatedAt;
    validateChart(source);
  }
  return result;
}
