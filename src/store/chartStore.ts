import { create } from "zustand";
import type { Chart, Selection } from "../domain/model";
import { normalizeRows } from "../domain/edit";
import { sampleChart } from "../domain/sample";
interface State {
  chart: Chart;
  past: Chart[];
  future: Chart[];
  selection: Selection | null;
  selectedBar: string | null;
  selectedMilestone: string | null;
  selectedRow: string | null;
  revision: number;
  edit: (fn: (chart: Chart) => void) => void;
  load: (c: Chart) => void;
  select: (s: Selection | null, bar?: string, milestone?: string) => void;
  undo: () => void;
  redo: () => void;
}
export const useChartStore = create<State>((set) => ({
  chart: sampleChart(),
  past: [],
  future: [],
  selection: null,
  selectedBar: null,
  selectedMilestone: null,
  selectedRow: null,
  revision: 0,
  edit: (fn) =>
    set((s) => {
      const chart = structuredClone(s.chart);
      fn(chart);
      normalizeRows(chart);
      chart.updatedAt = new Date().toISOString();
      return {
        chart,
        past: [...s.past.slice(-79), s.chart],
        future: [],
        revision: s.revision + 1,
      };
    }),
  load: (chart) =>
    set((s) => ({
      chart: structuredClone(chart),
      past: [],
      future: [],
      selection: null,
      selectedBar: null,
      selectedMilestone: null,
      selectedRow: null,
      revision: s.revision + 1,
    })),
  select: (selection, bar, milestone) =>
    set((s) => ({
      selection,
      selectedBar: bar ?? null,
      selectedMilestone: milestone ?? null,
      selectedRow: selection
        ? (s.chart.rows[selection.rowStart]?.id ?? null)
        : null,
    })),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            chart: { ...s.past.at(-1)!, updatedAt: new Date().toISOString() },
            past: s.past.slice(0, -1),
            future: [s.chart, ...s.future],
            selectedBar: null,
            selectedMilestone: null,
            selection: null,
            revision: s.revision + 1,
          }
        : {},
    ),
  redo: () =>
    set((s) =>
      s.future.length
        ? {
            chart: { ...s.future[0], updatedAt: new Date().toISOString() },
            past: [...s.past, s.chart],
            future: s.future.slice(1),
            selectedBar: null,
            selectedMilestone: null,
            selection: null,
            revision: s.revision + 1,
          }
        : {},
    ),
}));
